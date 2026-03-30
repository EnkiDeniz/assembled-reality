# Starter Template Notes

This repo has been cleaned up so the shared shell is easier to clone and rebrand for a second site with the same visual language.

## Change These First

1. Edit `src/lib/site-config.ts`
   This is now the main place for:
   - site name
   - base URL
   - SEO defaults
   - nav/footer links
   - homepage shell copy
   - CTA links
   - beta signup email settings

2. Replace brand assets
   - `public/logo.png`
   - `public/og-image.png`

3. Replace or remove long-form LAKIN content
   - `src/app/about/page.tsx`
   - `src/app/developers/DevelopersClient.tsx`
   - `src/lib/blog.ts`
   - `src/lib/learn.ts`
   - `src/app/api/content-md/[...path]/route.ts`
   - `src/app/llms.txt/route.ts`
   - `src/app/llms-ctx.txt/route.ts`

4. Remove sections you do not want
   Typical examples:
   - blog
   - learn
   - developers
   - beta signup

5. Run a final verification
   - `npm run build`

## What Is Config-Driven Now

These parts now read from `src/lib/site-config.ts`:

- root metadata in `src/app/layout.tsx`
- nav and footer
- homepage hero and core section copy
- beta signup copy and resend settings
- sitemap, robots, RSS, and LLM routes
- article/page canonical URLs and social metadata

## Good Clone Workflow

1. Duplicate this repo into the new project.
2. Update `src/lib/site-config.ts`.
3. Swap the logo and OG image.
4. Rewrite homepage/about/developer/blog/learn content as needed.
5. Connect the new repo to its own Vercel project and domain.

## One Important Note

This template still contains LAKIN-specific editorial content by design, because it is the current live site's content base. The cleanup in this pass was about moving identity, routing, SEO, and shell styling into reusable structure so the next clone is much faster and safer.
