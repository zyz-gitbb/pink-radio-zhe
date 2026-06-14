import { notFound } from "next/navigation";
import { getChannelById } from "@/app/actions";
import { ChannelContent } from "@/components/channel-content";

interface ChannelPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { id } = await params;
  const channel = await getChannelById(id);

  if (!channel) {
    notFound();
  }

  return <ChannelContent channel={channel} />;
}
