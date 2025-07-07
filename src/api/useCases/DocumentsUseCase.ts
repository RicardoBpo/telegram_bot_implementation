import DocumentsRepository from "../repositories/DocumentsRepository";
import { 
    DocumentSignatureResponse, 
    DocumentsListResponse, 
    rejectedParams, 
    signatureParams, 
    verifyTokenParams
} from "../types/DocumentTypes";
import { GeneralResponse } from "../types/GeneralTypes";


class DocumentsUseCase {

    async verifyToken({ 
        token,  
    }: verifyTokenParams): Promise<GeneralResponse<DocumentsListResponse>> {
        return await DocumentsRepository.verifyToken(
            token,
        );
    }

    async rejectDocument({
        documentId,
        signerId,
        token,
        reason,
    }: rejectedParams): Promise<GeneralResponse<DocumentsListResponse>> {
        return await DocumentsRepository.rejectDocument({
            documentId,
            signerId,
            token,
            reason
        });
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
        return await DocumentsRepository.signDocument({
            token,
            documentId,
            signerId,
            signId,
            signature,
            signatureType,
            signatureText,
            signatureFontFamily
        });
    }
}

const documentsUseCase = new DocumentsUseCase();
export default documentsUseCase;
