import type { Props } from "astro";
import IconGitHub from "@/assets/icons/IconGitHub.svg";
import IconBrandX from "@/assets/icons/IconBrandX.svg";
import IconLinkedin from "@/assets/icons/IconLinkedin.svg";
import IconGoogleScholar from "@/assets/icons/IconGoogleScholar.svg";
import IconHuggingFace from "@/assets/icons/IconHuggingFace.svg";
import IconCV from "@/assets/icons/IconCV.svg";
import { SITE } from "@/config";

interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: (_props: Props) => Element;
}

export const SOCIALS: Social[] = [
  {
    name: "GitHub",
    href: "https://github.com/speed1313",
    linkTitle: `${SITE.title} on GitHub`,
    icon: IconGitHub,
  },
  {
    name: "X",
    href: "https://x.com/strayer_13",
    linkTitle: `${SITE.title} on X`,
    icon: IconBrandX,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/speed1313/",
    linkTitle: `${SITE.title} on LinkedIn`,
    icon: IconLinkedin,
  },
  // {
  //   name: "Mail",
  //   href: "mailto:yourmail@gmail.com",
  //   linkTitle: `Send an email to ${SITE.title}`,
  //   icon: IconMail,
  // },
  {
    name: "Hugging Face",
    href: "https://huggingface.co/speed",
    linkTitle: `${SITE.title} on Hugging Face`,
    icon: IconHuggingFace,
  },
  {
    name: "Google Scholar",
    href: "https://scholar.google.com/citations?user=717QdNoAAAAJ",
    linkTitle: `${SITE.title} on Google Scholar`,
    icon: IconGoogleScholar,
  },
  {
    name: "CV",
    href: "/cv.pdf",
    linkTitle: `${SITE.title} CV`,
    icon: IconCV,
  },
] as const;
