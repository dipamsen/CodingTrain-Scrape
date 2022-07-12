const yaml = require("yaml-front-matter");
const fs = require("fs");
const { Octokit } = require("@octokit/core");
const axios = require("axios").default;

const owner = "CodingTrain";
const repo = "website-archive";
const folder = "_beginners/p5js";

// init octokit
const gh = new Octokit({});

const template = {
  title: "",
  description: "",
  videoId: "",
  date: "",
  languages: ["p5.js", "JavaScript"],
  topics: ["basics"],
  canContribute: true,
  timestamps: [],
  codeExamples: [
    {
      title: "Random Square Design",
      description: "Using the random() function to draw randomly sized squares",
      image: "GameOfLife.webp",
      urls: {
        p5: "https://editor.p5js.org/codingtrain/sketches/Sl8ml_Lz8",
        other:
          "https://github.com/CodingTrain/website/tree/main/beginners/p5js/2.4-random/random-square-design",
      },
    },
  ],
  groupLinks: [
    {
      title: "Group of links title",
      links: [
        {
          title: "Link 1 title",
          url: "link 1 url",
          description: "description of content linked",
        },
        {
          title: "Link 2 title",
          url: "link 2 url",
          description: "description of content linked",
        },
      ],
    },
  ],
};

async function main() {
  const files = await gh.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path: folder,
  });
  for (const file of files.data) {
    if (file.name === "index.md") return;
    const { data } = await axios.get(file.download_url);
    const parsed = yaml.loadFront(data);
    const videoFile = {
      title: parsed.video_number + " " + parsed.title,
      description: parsed.__content.trim(),
      videoId: parsed.video_id,
      date: parsed.date.toLocaleDateString(),
      languages: ["p5.js", "JavaScript"],
      topics: ["basics"],
      canContribute: true,
      timestamps:
        parsed.topics?.map((t) => ({ time: t.time, title: t.title })) || [],
      codeExamples: [
        parsed.web_editor
          ? {
              title: parsed.title,
              description: "Demonstration of " + parsed.title,
              image: "",
              urls: {
                p5:
                  "https://editor.p5js.org/codingtrain/sketches/" +
                  parsed.web_editor,
              },
            }
          : null,
        ...(parsed.variations?.map((ex) => ({
          title: ex.name,
          description: "Demonstration of " + ex.name,
          image: "",
          urls: {
            p5: "https://editor.p5js.org/codingtrain/sketches/" + ex.web_editor,
          },
        })) || []),
      ].filter((ex) => ex),
      groupLinks: [
        parsed.videos
          ? {
              title: "Videos",
              links: parsed.videos.map((v) => ({
                icon: v.author === "The Coding Train" ? "🚂" : "🎥",
                title: v.title,
                url: v.url,
                description:
                  v.author === "The Coding Train"
                    ? `Tutorial on ${v.title}`
                    : `${v.author}'s Tutorial on ${v.title}`,
              })),
            }
          : null,
        parsed.links
          ? {
              title: "References",
              links: parsed.links.map((l) => ({
                icon: "🔗",
                title: l.title,
                url: l.url,
                description: l.title,
              })),
            }
          : null,
      ].filter((g) => g),
    };
    const contributions = parsed.contributions?.map((c) => ({
      title: c.title,
      author: {
        name: typeof c.author === "string" ? c.author : c.author.name,
        url: c.author.url || c.author.source,
      },
      url: c.url,
    }));

    console.log(videoFile);
    console.log(contributions);
  }
}

main();
