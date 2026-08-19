import {AdForm} from "@/app/ad/AdForm";
import {AdCreationGate} from "@/app/components/AdCreationGate";

export default function CreateAdPage( ) {
    return (
        <AdCreationGate>
            <AdForm />
        </AdCreationGate>
    );
}