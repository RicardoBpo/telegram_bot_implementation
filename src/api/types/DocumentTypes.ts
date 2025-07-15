
export interface DocumentsListResponse {
  document: Document;
  signerId: string;
}

export interface Document {
  _id: string;
  documentId: string;
  filename: string;
  owner: string;
  version: number;
  participants: Participant[];
  metadata: Metadata;
  status: string;
  isActive: boolean;
  isDeleted: boolean;
  isRecycler: boolean;
  isBlockchainRegistered: boolean;
  createdAt: string;
  updatedAt: string;
  blockchain: BlockchainInfo;
  options: DocumentOptions;
}

export interface MetadataVersion {
  _id?: string;
  createdAt?: string;
  signatureType?: string;
  signature?: string;
  signatureName?: string;
  signatureS3Key?: string;
  signatureText?: string;
  signatureFontFamily?: string;
  isValid?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface Participant {
  _id: string;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  order: number;
  requireValidation: boolean;
  typeValidation: string[];
  status: 'pending' | 'sent' | 'signed' | 'rejected';
  signerLink: string | null;
  historySignatures: HistorySignatures;
  signatures: Signature[];
}

export interface HistorySignatures {
  hasSigned: boolean;
  hasRejected: boolean;
  rejectionReason: string;
  signatureType: string;
  signatureImageUrl: string;
  signatureText: string;
  signatureFontFamily: string;
  canSign: boolean;
  signedAt: string | null;
  rejectedAt: string | null;
  ip: string | null;
  userAgent: string | null;
  auditLog: any[];
}

export interface Signature {
  _id: string;
  id: string;
  recipientEmail: string;
  recipientsName: string;
  signatureText: string;
  signatureContentFixed: boolean;
  signatureDelete: boolean;
  signatureIsEdit: boolean;
  slideElement: string;
  slideIndex: number;
  top: number;
  left: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  metadata_versions: MetadataVersion[];
}

export interface MetadataVersion {
  _id?: string;
  createdAt?: string;
  signatureType?: string;
  signature?: string;
  signatureName?: string;
  signatureS3Key?: string;
  signatureText?: string;
  signatureFontFamily?: string;
  isValid?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface Metadata {
  size: number;
  mimetype: string;
  url: string;
  filename: string;
  s3Key?: string;
  hash: string;
  versions: Version[];
}

interface Version { 
    url: string;
    filename: string;
    s3key: string;
    signedAt: string;
    _id: string;
}

export interface BlockchainInfo {
  contractId: string | null;
  transactionId: string | null;
  hash: string | null;
  registeredAt: string | null;
  status: string;
  attempts: number;
}

export interface DocumentOptions {
  allowReject: boolean;
  remindEvery3Days: boolean;
}


export interface TokenData {
  signatureId: string;
  participantEmail: string;
  participantId?: string | number; 
  token: string;
  url: string;
}


export interface AuditLogEntry {
  action: string;
  timestamp: string;
  reason: string;
  _id: string;
}

export interface rejectedParams { 
    documentId: string;
    signerId: string;
    token: string;
    reason: string;
}

export interface signatureParams { 
    token: string;
    documentId: string;
    signerId: string;
    signId: string;
    signature?: File;
    signatureType: string;
    signatureFontFamily?: string;
    signatureText?: string;
}

export interface Metadata {
  size: number;
  mimetype: string;
  url: string;
  filename: string;
  s3Key?: string;
}



export interface BlockchainInfo {
  contractId: string | null;
  transactionId: string | null;
  hash: string | null;
  registeredAt: string | null;
  status: string;
  attempts: number;
}

export interface ListDocumentsParams {
  page?: number;
  limit?: number;
  status?: string;
  signal?: AbortSignal;
}

export interface verifyTokenParams {
  token: string;
  signal?: AbortSignal;
}

export interface newDocumentRequest { 
    participians: Participant[];
    filename: string;
    status: string; 
    file: File;
}

export interface DocumentSignatureResponse { 
    _id: string;
    documentId: string;
    filename: string;
    owner: string;
    version: number;
    participants: Participant[];
    metadata: Metadata;
    status: string;
    isActive: boolean;
    isDeleted: boolean;
    isRecycler: boolean;
    isBlockchainRegistered: boolean;
    createdAt: string;
    updatedAt: string;
    blockchain: BlockchainInfo;
    options: DocumentOptions;
}