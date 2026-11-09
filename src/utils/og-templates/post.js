import ogImage from "./base";

export default async post =>
  ogImage({ title: post.data.title, label: post.data.tags[0] });
