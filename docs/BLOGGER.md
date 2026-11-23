# Connect your Blogger blog

When connected, your newest Blogger articles appear on the website's **Blog** page and in `/llms.txt` and `/llms-full.txt` (the files AI assistants read) within about 5 minutes of publishing. Nothing needs redeploying.

You need two values: an **API key** and your **blog ID**.

## 1. Get the API key (Google Cloud console)

1. Open https://console.cloud.google.com and pick your project (the one you already use is fine).
2. Menu, **APIs & Services**, **Library**. Search **Blogger API v3** and click **Enable**.
3. Menu, **APIs & Services**, **Credentials**, **Create credentials**, **API key**.
4. Click **Edit API key** on the new key. Under **API restrictions** choose **Restrict key** and tick **Blogger API v3** only. Save. (Leave "Application restrictions" as None: the website's servers have no fixed address.)
5. Copy the key. Treat it like a password.

## 2. Get the blog ID

1. Open https://www.blogger.com and open your blog.
2. Look at the address in the browser. It looks like `https://www.blogger.com/blog/posts/1234567890123456789`.
3. The long number is the **blog ID**.

The blog must be **public**, and only published ("live") posts are shown. Drafts never appear.

## 3. Give them to the website

Run these in PowerShell. Each one asks you to paste a value, so nothing is saved in a file or in chat:

```powershell
npx wrangler secret put BLOGGER_BLOG_ID --name flux
npx wrangler secret put BLOGGER_API_KEY --name flux
```

(If you use the Cloudflare dashboard instead: Workers & Pages, `flux`, Settings, Variables and Secrets, add both as **Secret**.)

## 4. Check it

1. Publish (or keep) at least one live post on your Blogger blog.
2. Open `https://flux.detroonshah.workers.dev/blog` and `https://flux.detroonshah.workers.dev/llms.txt`.
3. Your article titles should be listed. The next time you publish, the lists update by themselves after about 5 minutes.

If the list stays empty: check the blog is public and has a live post, the API key is restricted to Blogger API v3 (not another API), and both secrets were set on the Worker named `flux`.

## What the website does with your posts

- It shows each title with a link to the original article on Blogger. It never copies the article text, so Google sees one original page, yours.
- It keeps the list for 5 minutes, so visitors do not use up Blogger's request allowance (the default is generous, 10,000 requests a day; check Google's current limits).
- If Blogger is briefly down, it keeps showing the last list it had.

## Telling Google and AI who made it

Every page now says it was made by Zubair Hussain (zubairhussain.xyz): in the page metadata, in the structured data on the home page, in a footer link, in `/humans.txt`, and at the top of `/llms.txt` and `/llms-full.txt`. For the best effect, also link back from zubairhussain.xyz to this website, and add Flux to your Google Search Console account once you have your own domain.
