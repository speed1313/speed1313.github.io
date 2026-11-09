import { ogImagePaths, ogImageResponse } from "@/utils/ogImageRoute";

export const getStaticPaths = () => ogImagePaths("ja");
export const GET = ogImageResponse;
