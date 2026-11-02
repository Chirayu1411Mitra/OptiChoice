import { Construction } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageBody } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/ui/states";

export default function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <>
      <Header title={title} />
      <PageBody>
        <EmptyState icon={<Construction className="h-6 w-6" />} title={`${title} is coming next`} description={description} />
      </PageBody>
    </>
  );
}
