import {AdForm} from "@/app/ad/AdForm";

export default function ReEditAdPage({ params }: { params: { id: string } }) {
    return <AdForm adId={params.id} />;
}