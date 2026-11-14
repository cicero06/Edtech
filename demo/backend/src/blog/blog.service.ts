import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { C } from '../firebase/collections.js';
import { FirebaseService, fromDoc } from '../firebase/firebase.service.js';
import type { AdultUser, BlogPost } from '../firebase/models.js';
import type { PostBlockDto, UpsertBlogPostDto } from './dto.js';

/**
 * Writer allowlist: comma-separated emails in BLOG_AUTHOR_EMAILS. The guard
 * proves the caller is a real Firebase user; this list decides who may write.
 * If unset, nobody can write (fail closed).
 */
const AUTHOR_EMAILS = new Set(
  (process.env.BLOG_AUTHOR_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

const DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK_URL;

const RESERVED_SLUGS = new Set(['yeni', 'index', 'api', '404']);

const TR_MAP: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u',
};

function slugify(title: string): string {
  return title
    .toLocaleLowerCase('tr')
    .split('')
    .map((c) => TR_MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function displayDateNow(): string {
  return new Date().toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });
}

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(private readonly firebase: FirebaseService) {}

  private get posts() {
    return this.firebase.db.collection(C.blogPosts);
  }

  private requireAuthor(user: AdultUser) {
    const email = user.email?.toLowerCase();
    if (!email || !AUTHOR_EMAILS.has(email)) {
      throw new ForbiddenException('This account is not an approved author');
    }
  }

  private assertValidBody(body: PostBlockDto[]) {
    for (const block of body) {
      const kinds = [block.h, block.p, block.ul].filter(
        (v) => v !== undefined,
      ).length;
      if (kinds !== 1) {
        throw new BadRequestException(
          'Each body block must contain exactly one of h, p or ul',
        );
      }
    }
  }

  /** Plain JSON blocks (class-validator instances → maps Firestore accepts). */
  private cleanBody(body: PostBlockDto[]) {
    return body.map((b) =>
      b.h !== undefined ? { h: b.h } : b.ul !== undefined ? { ul: [...b.ul] } : { p: b.p },
    );
  }

  private toApi(post: BlogPost) {
    return {
      slug: post.slug,
      title: post.title,
      tag: post.tag,
      date: post.displayDate,
      excerpt: post.excerpt,
      body: post.body,
    };
  }

  private async slugTaken(slug: string, exceptId?: string) {
    const snap = await this.posts.where('slug', '==', slug).limit(2).get();
    return snap.docs.some((d) => d.id !== exceptId);
  }

  private async findOwned(user: AdultUser, id: string, verb: string) {
    const post = fromDoc<BlogPost>(await this.posts.doc(id).get());
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== user.id) {
      throw new ForbiddenException(`Only the author can ${verb} this post`);
    }
    return post;
  }

  // ---------------- public reads ----------------

  async listPublished() {
    const snap = await this.posts
      .where('status', '==', 'PUBLISHED')
      .orderBy('publishedAt', 'desc')
      .get();
    return snap.docs.map((d) => this.toApi(fromDoc<BlogPost>(d)!));
  }

  async getPublished(slug: string) {
    const snap = await this.posts
      .where('slug', '==', slug)
      .where('status', '==', 'PUBLISHED')
      .limit(1)
      .get();
    if (snap.empty) throw new NotFoundException('Post not found');
    return this.toApi(fromDoc<BlogPost>(snap.docs[0])!);
  }

  // ---------------- author writes ----------------

  async listMine(user: AdultUser) {
    this.requireAuthor(user);
    const snap = await this.posts
      .where('authorId', '==', user.id)
      .orderBy('updatedAt', 'desc')
      .get();
    return snap.docs.map((d) => {
      const p = fromDoc<BlogPost>(d)!;
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        tag: p.tag,
        displayDate: p.displayDate,
        excerpt: p.excerpt,
        body: p.body,
        status: p.status,
        publishedAt: p.publishedAt,
        updatedAt: p.updatedAt,
      };
    });
  }

  async create(user: AdultUser, dto: UpsertBlogPostDto) {
    this.requireAuthor(user);
    this.assertValidBody(dto.body);
    const slug = (dto.slug ?? slugify(dto.title)).slice(0, 80);
    if (!slug || RESERVED_SLUGS.has(slug)) {
      throw new BadRequestException('Invalid or reserved slug');
    }
    if (await this.slugTaken(slug)) {
      throw new ConflictException('Slug already in use');
    }
    const now = new Date();
    const post: BlogPost = {
      id: randomUUID(),
      slug,
      title: dto.title.trim(),
      tag: dto.tag.trim(),
      displayDate: dto.displayDate?.trim() || displayDateNow(),
      excerpt: dto.excerpt.trim(),
      body: this.cleanBody(dto.body),
      authorId: user.id,
      status: dto.publish ? 'PUBLISHED' : 'DRAFT',
      publishedAt: dto.publish ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    const { id, ...data } = post;
    await this.posts.doc(id).create(data);
    if (dto.publish) this.triggerDeploy();
    return post;
  }

  async update(user: AdultUser, id: string, dto: UpsertBlogPostDto) {
    this.requireAuthor(user);
    this.assertValidBody(dto.body);
    const post = await this.findOwned(user, id, 'edit');
    if (dto.slug && dto.slug !== post.slug) {
      if (RESERVED_SLUGS.has(dto.slug)) {
        throw new BadRequestException('Reserved slug');
      }
      if (await this.slugTaken(dto.slug, id)) {
        throw new ConflictException('Slug already in use');
      }
    }
    const wasPublished = post.status === 'PUBLISHED';
    const updated: BlogPost = {
      ...post,
      slug: dto.slug ?? post.slug,
      title: dto.title.trim(),
      tag: dto.tag.trim(),
      displayDate: dto.displayDate?.trim() || post.displayDate,
      excerpt: dto.excerpt.trim(),
      body: this.cleanBody(dto.body),
      status: dto.publish ? 'PUBLISHED' : post.status,
      publishedAt: dto.publish && !wasPublished ? new Date() : post.publishedAt,
      updatedAt: new Date(),
    };
    const { id: _id, ...data } = updated;
    await this.posts.doc(id).set(data);
    if (wasPublished || dto.publish) this.triggerDeploy();
    return updated;
  }

  async publish(user: AdultUser, id: string) {
    this.requireAuthor(user);
    const post = await this.findOwned(user, id, 'publish');
    let updated = post;
    if (post.status !== 'PUBLISHED') {
      const now = new Date();
      updated = { ...post, status: 'PUBLISHED', publishedAt: now, updatedAt: now };
      await this.posts
        .doc(id)
        .update({ status: 'PUBLISHED', publishedAt: now, updatedAt: now });
    }
    this.triggerDeploy();
    return updated;
  }

  /** Fire-and-forget: ask Vercel to rebuild so the post gets a static page. */
  private triggerDeploy() {
    if (!DEPLOY_HOOK) return;
    fetch(DEPLOY_HOOK, { method: 'POST' }).catch((err) =>
      this.logger.warn(`deploy hook failed: ${err}`),
    );
  }
}
