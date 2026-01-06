Heyyyy

So i want to build a simple video to watch list website, it is only for my own usage. However, although i am a super neovim user, btw, i suck at coding, so i will need your help to build one for me. Don't worry, i am pretty good at writing product documentations and asking for quick calls and overruning stand up for an hour, so you are in for a treat!!

Here are some general requirements:

- I plan to deploy the app on cloudflare (workers), i will connect the github repo to workers, so no need to worry about CICD
- Use Nextjs, APP Router
- Use bun
- UI -> modern, shadcn, vercel, nextjs looks and vibes
  - Let me know if you need to use browser, i will setup one for use, you can use `playwriter` tools.
- Use postgres for the database
- Typescript all around
- Use latest version for everything
  - When you need to search docs, use `context7` tools.

Here are the product requirements:

- To watch list management: (or more generally, video urls management)
	- Add, open the url of, mark as watched, mark as unwatched, delete a to watch item
	- View the list of unwatched items
	- Toggle to view the list of watched items

- A to watch item contains:
	- The url of the video
	- The name of the video
	- Thumbnail of the video (optional)
	- The platform of the video

- To add an item:
	- User will enter the url
	- The app should then tries it best, use any tool possible to retrieve the other fields: name, platform and thumbnails
	- Possible site includes:
		- Youtube
		- Netflix
		- Nebula (The BEST video platform)
		- Twitch VOD
