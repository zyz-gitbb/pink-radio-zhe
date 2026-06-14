import { getChannels, getCategories } from "@/app/actions";
import { HomeContent } from "@/components/home-content";

export default async function Home() {
  const [channels, categories] = await Promise.all([
    getChannels(),
    getCategories(),
  ]);

  return <HomeContent channels={channels} categories={categories} />;
}
