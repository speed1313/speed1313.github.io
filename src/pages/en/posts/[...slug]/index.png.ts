import { ogImagePaths, ogImageResponse } from "@/utils/ogImageRoute";

export const getStaticPaths = () => ogImagePaths("en");
export const GET = ogImageResponse;
