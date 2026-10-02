import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AdultUser, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PostBlockDto, UpsertBlogPostDto } from './dto.js';

/**
 * Writer allowlist: comma-separated emails in BLOG_AUTHOR_EMAILS. The guard
 * proves the caller is a real Supabase user; this list decides who may write.
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

  constructor(private readonly prisma: PrismaService) {}

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

  private toApi(post: {
    slug: string;
    title: string;
    tag: string;
    displayDate: string;
    excerpt: string;
    body: Prisma.JsonValue;
  }) {
    return {
      slug: post.slug,
      title: post.title,
      tag: post.tag,
      date: post.displayDate,
      excerpt: post.excerpt,
      body: post.body,
    };
  }

  // ---------------- public reads ----------------

  async listPublished() {
    const posts = await this.prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
    });
    return posts.map((p) => this.toApi(p));
  }

  async getPublished(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: 'PUBLISHED' },
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.toApi(post);
  }

  // ---------------- author writes ----------------

  async listMine(user: AdultUser) {
    this.requireAuthor(user);
    return this.prisma.blogPost.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        tag: true,
        displayDate: true,
        excerpt: true,
        body: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
  }

  async create(user: AdultUser, dto: UpsertBlogPostDto) {
    this.requireAuthor(user);
    this.assertValidBody(dto.body);
    const slug = (dto.slug ?? slugify(dto.title)).slice(0, 80);
    if (!slug || RESERVED_SLUGS.has(slug)) {
      throw new BadRequestException('Invalid or reserved slug');
    }
    if (await this.prisma.blogPost.findUnique({ where: { slug } })) {
      throw new ConflictException('Slug already in use');
    }
    const post = await this.prisma.blogPost.create({
      data: {
        slug,
        title: dto.title.trim(),
        tag: dto.tag.trim(),
        displayDate: dto.displayDate?.trim() || displayDateNow(),
        excerpt: dto.excerpt.trim(),
        body: dto.body as unknown as Prisma.InputJsonValue,
        authorId: user.id,
        status: dto.publish ? 'PUBLISHED' : 'DRAFT',
        publishedAt: dto.publish ? new Date() : null,
      },
    });
    if (dto.publish) this.triggerDeploy();
    return { ...post, body: post.body };
  }

  async update(user: AdultUser, id: string, dto: UpsertBlogPostDto) {
    this.requireAuthor(user);
    this.assertValidBody(dto.body);
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== user.id) {
      throw new ForbiddenException('Only the author can edit this post');
    }
    if (dto.slug && dto.slug !== post.slug) {
      if (RESERVED_SLUGS.has(dto.slug)) {
        throw new BadRequestException('Reserved slug');
      }
      if (
        await this.prisma.blogPost.findUnique({ where: { slug: dto.slug } })
      ) {
        throw new ConflictException('Slug already in use');
      }
    }
    const wasPublished = post.status === 'PUBLISHED';
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        slug: dto.slug ?? post.slug,
        title: dto.title.trim(),
        tag: dto.tag.trim(),
        displayDate: dto.displayDate?.trim() || post.displayDate,
        excerpt: dto.excerpt.trim(),
        body: dto.body as unknown as Prisma.InputJsonValue,
        status: dto.publish ? 'PUBLISHED' : post.status,
        publishedAt:
          dto.publish && !wasPublished ? new Date() : post.publishedAt,
      },
    });
    if (wasPublished || dto.publish) this.triggerDeploy();
    return updated;
  }

  async publish(user: AdultUser, id: string) {
    this.requireAuthor(user);
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== user.id) {
      throw new ForbiddenException('Only the author can publish this post');
    }
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data:
        post.status === 'PUBLISHED'
          ? {}
          : { status: 'PUBLISHED', publishedAt: new Date() },
    });
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
