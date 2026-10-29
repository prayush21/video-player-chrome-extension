# Privacy Policy for Netflix-like Video Player

**Effective Date:** October 29, 2026

## Introduction

Netflix-like Video Player is a Chrome extension that lets you save videos from X (Twitter) and YouTube to a "My List" and watch them in a Netflix-style player. This privacy policy explains how the extension handles your information.

## Data Collection and Usage

The developer does not collect, sell, or receive any personal data or user information. Nothing is sent to the developer's servers, and the extension contains no analytics, advertising, or tracking.

## Data Stored on Your Device

When you click "My List" on a video, the extension saves that video's title, link, and thumbnail, along with your playback preferences, in Chrome's local extension storage (`chrome.storage.local`). This data stays on your device, is used only to show your list in the player and on the page buttons, and is never transmitted to the developer or any third party. You can remove it at any time by removing items from My List or uninstalling the extension.

## Permissions

The extension requests the following permissions, each used only for its core function:

- **storage**: Saves your My List, Up Next queue, and preferences locally on your device.
- **contextMenus**: Adds right-click menu options for saving and playing videos.
- **scripting** and **activeTab**: Let the extension act on the current tab only when you invoke it.
- **Host access to x.com, twitter.com, www.youtube.com, and cdn.syndication.twimg.com**: Used to add the My List button to posts and pages with video, to read the video you choose to save, and to look up the video for an X post you save. The extension does not read other sites or your browsing history.
- **declarativeNetRequestWithHostAccess**: Used for a single rule that sets the Referer header on requests to `www.youtube.com/embed/`, which YouTube requires to play embedded videos. It does not block, redirect, or read any other traffic.

## Third-Party Services

The extension does not share your data with third parties. To play videos, it loads content directly from the original sources (YouTube's embedded player, and X's video servers). Those requests go from your browser to those services and are subject to their own privacy policies. The extension does not add any data to them beyond what loading the video normally involves.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Changes will be posted in the extension's repository.

## Contact Us

If you have any questions about this privacy policy, please contact us through the extension's GitHub repository: [prayush21/video-player-chrome-extension](https://github.com/prayush21/video-player-chrome-extension).

## Compliance

The use of information received from Chrome APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.
