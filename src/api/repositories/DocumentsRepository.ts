
import {
    DocumentSignatureResponse,
    DocumentsListResponse,
    rejectedParams,
    signatureParams,
} from "../types/DocumentTypes";
import { GeneralResponse } from "../types/GeneralTypes";
const baseurl = `https://ebtuzyirod.execute-api.sa-east-1.amazonaws.com/api/v1`;

class ContactRepository {

    async verifyToken(
        token: string,
    ): Promise<GeneralResponse<DocumentsListResponse>> {
            const res = await fetch(`${baseurl}/documents/sign/${token}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Error en fetch de documento:", res.status, errorText);
                throw new Error(`Error en fetch de documento: ${res.status} ${errorText}`);
            }

            const data: GeneralResponse<DocumentsListResponse> = await res.json();
            return data;
    }

    async rejectDocument({
        documentId,
        signerId,
        token,
        reason,
        }: rejectedParams): Promise<GeneralResponse<DocumentsListResponse>> {
        const formData = new FormData();
        formData.append("token", token);
        formData.append("rejected", "true");
        formData.append("reason", reason);

        const res = await fetch(`${baseurl}/documents/${documentId}/signer/${signerId}`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Error en fetch de documento:", res.status, errorText);
            throw new Error(`Error en fetch de documento: ${res.status} ${errorText}`);
        }

        const data: GeneralResponse<DocumentsListResponse> = await res.json();
        return data;
    }

    async signDocument({
        token,
        documentId,
        signerId,
        signId,
        signature,
        signatureType,
        signatureText,
        signatureFontFamily = "Arial",
    }: signatureParams): Promise<GeneralResponse<DocumentSignatureResponse>> {
        const formData = new FormData();
        formData.append("token", token);
        formData.append("signatures[0].signId", signId);
        if (signature) {
            formData.append("signatures[0].signature", signature);
        }
        formData.append("signatures[0].signatureType", signatureType);
        if (signatureText) {
            formData.append("signatures[0].signatureText", signatureText);
        }
        if (signatureFontFamily) {
            formData.append("signatures[0].signatureFontFamily", signatureFontFamily);
        }

        const res = await fetch(`${baseurl}/documents/${documentId}/signer/${signerId}`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Error en fetch de documento:", res.status, errorText);
            throw new Error(`Error en fetch de documento: ${res.status} ${errorText}`);
        }

        const data: GeneralResponse<DocumentSignatureResponse> = await res.json();
        return data;
    }

}

const contactRepository = new ContactRepository();
export default contactRepository;