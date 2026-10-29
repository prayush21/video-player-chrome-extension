import React from "react";

// "Where's the My List button?" Two small drawings of the row of buttons
// under a post on X and under a video on YouTube, with our button picked out.
// Drawn here, not screenshots: they stay sharp, match the real button
// (public/content/content.css) and don't ship anyone else's interface.

const ADD_ICON =
  "M4 6h11v2H4zm0 4h11v2H4zm0 4h7v2H4zm13-1v-3h2v3h3v2h-3v3h-2v-3h-3v-2z";

const MyListButton: React.FC<{ variant: "x" | "youtube" }> = ({ variant }) => (
  <span className={`sg-btn sg-btn-${variant}`}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={ADD_ICON} />
    </svg>
    My List
  </span>
);

// Plain grey shapes standing in for the site's own buttons.
const Ghost: React.FC<{ wide?: boolean }> = ({ wide }) => (
  <span className={`sg-ghost ${wide ? "is-wide" : ""}`} aria-hidden="true" />
);

const SaveGuide: React.FC = () => (
  <section className="sg" aria-labelledby="sg-title">
    <h2 id="sg-title" className="sg-title">
      Save videos while you browse
    </h2>
    <p className="sg-sub">
      Look for the red <strong>My List</strong> button on X and YouTube. Then
      click this extension's icon to watch everything here.
    </p>
    <div className="sg-cards">
      <figure className="sg-card">
        <div className="sg-bar sg-bar-x" aria-hidden="true">
          <Ghost />
          <Ghost />
          <Ghost />
          <Ghost />
          <MyListButton variant="x" />
          <Ghost />
        </div>
        <figcaption>
          <strong>On X</strong>
          <span>In the row of icons under any post with a video.</span>
        </figcaption>
      </figure>
      <figure className="sg-card">
        <div className="sg-bar sg-bar-yt" aria-hidden="true">
          <Ghost wide />
          <Ghost wide />
          <MyListButton variant="youtube" />
        </div>
        <figcaption>
          <strong>On YouTube</strong>
          <span>Next to Like and Share, under the video.</span>
        </figcaption>
      </figure>
    </div>
  </section>
);

export default SaveGuide;
