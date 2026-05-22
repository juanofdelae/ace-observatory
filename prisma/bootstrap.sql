-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('GOVERNMENT', 'UNIVERSITY', 'COMPANY', 'NGO', 'CHAMBER', 'OTHER');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('GOVERNMENT', 'PRIVATE_SECTOR', 'ACADEMIA', 'INTERNATIONAL_ORG', 'OTHER');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ES', 'EN', 'PT', 'FR');

-- CreateEnum
CREATE TYPE "InstrumentType" AS ENUM ('LOI', 'MOU', 'CONTRACT');

-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('INNOVATION', 'SMES', 'AGRITECH', 'LOGISTICS', 'EDTECH', 'TOURISM', 'MANUFACTURING', 'FINTECH', 'HEALTH', 'ENERGY', 'CLEAN_ENERGY', 'SMART_CITIES', 'CREATIVE_INDUSTRIES', 'ENTREPRENEURIAL_ECOSYSTEM', 'TRADE', 'OTHER');

-- CreateEnum
CREATE TYPE "Phase" AS ENUM ('SIGNED', 'CONTACTED', 'ACTIVE', 'RESULT');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'NEEDS_ATTENTION', 'CLOSED');

-- CreateEnum
CREATE TYPE "SurveyMilestone" AS ENUM ('DAY_30', 'DAY_60', 'DAY_90', 'MONTH_6', 'MONTH_12');

-- CreateEnum
CREATE TYPE "SupportCategory" AS ENUM ('INFORMATION', 'FACILITATION', 'CONNECTION', 'DOCUMENTATION', 'LOGISTICS', 'STRATEGIC');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'HIGH', 'STANDARD', 'LOW');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('DELEGATE', 'ORGANIZER', 'SPECIAL_GUEST', 'SPEAKER');

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flagAssetUrl" TEXT,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edition" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "shortLabel" TEXT,
    "year" INTEGER NOT NULL,
    "hostCity" TEXT NOT NULL,
    "hostCountryId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "heroImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Edition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "actorType" "ActorType",
    "countryId" TEXT,
    "countryLabel" TEXT NOT NULL,
    "city" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "sectorIds" "Sector"[] DEFAULT ARRAY[]::"Sector"[],
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "emailEncoded" TEXT,
    "role" TEXT,
    "organizationLabel" TEXT,
    "position" TEXT,
    "linkedin" TEXT,
    "preferredLang" "Language" NOT NULL DEFAULT 'ES',
    "countryId" TEXT,
    "institutionId" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sectorIds" "Sector"[] DEFAULT ARRAY[]::"Sector"[],
    "actorType" "ActorType",
    "participantRole" "ParticipantRole" NOT NULL DEFAULT 'DELEGATE',
    "source" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditionParticipant" (
    "editionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'DELEGATE',

    CONSTRAINT "EditionParticipant_pkey" PRIMARY KEY ("editionId","participantId")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "code" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "instrumentType" "InstrumentType" NOT NULL,
    "signedDate" TIMESTAMP(3) NOT NULL,
    "partyAId" TEXT NOT NULL,
    "signerAId" TEXT,
    "partyBId" TEXT NOT NULL,
    "signerBId" TEXT,
    "subject" TEXT NOT NULL,
    "delegate" TEXT,
    "primarySector" "Sector" NOT NULL,
    "tags" TEXT[],
    "phase" "Phase" NOT NULL DEFAULT 'SIGNED',
    "alertStatus" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "resultSummary" TEXT,
    "resultDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT,
    "editionId" TEXT,
    "milestone" "SurveyMilestone",
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "uniqueToken" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "category" "SupportCategory" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'STANDARD',
    "description" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusChange" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "fromPhase" "Phase",
    "toPhase" "Phase",
    "fromStatus" "AlertStatus",
    "toStatus" "AlertStatus",
    "changedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "editionId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "summary" TEXT,
    "contentMd" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "authorId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Edition_externalId_key" ON "Edition"("externalId");

-- CreateIndex
CREATE INDEX "Edition_year_idx" ON "Edition"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_externalId_key" ON "Institution"("externalId");

-- CreateIndex
CREATE INDEX "Institution_countryId_idx" ON "Institution"("countryId");

-- CreateIndex
CREATE INDEX "Institution_type_idx" ON "Institution"("type");

-- CreateIndex
CREATE INDEX "Institution_deletedAt_idx" ON "Institution"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_externalId_key" ON "Participant"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_key" ON "Participant"("email");

-- CreateIndex
CREATE INDEX "Participant_countryId_idx" ON "Participant"("countryId");

-- CreateIndex
CREATE INDEX "Participant_institutionId_idx" ON "Participant"("institutionId");

-- CreateIndex
CREATE INDEX "Participant_deletedAt_idx" ON "Participant"("deletedAt");

-- CreateIndex
CREATE INDEX "EditionParticipant_editionId_idx" ON "EditionParticipant"("editionId");

-- CreateIndex
CREATE INDEX "EditionParticipant_participantId_idx" ON "EditionParticipant"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_externalId_key" ON "Agreement"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_code_key" ON "Agreement"("code");

-- CreateIndex
CREATE INDEX "Agreement_editionId_idx" ON "Agreement"("editionId");

-- CreateIndex
CREATE INDEX "Agreement_phase_idx" ON "Agreement"("phase");

-- CreateIndex
CREATE INDEX "Agreement_alertStatus_idx" ON "Agreement"("alertStatus");

-- CreateIndex
CREATE INDEX "Agreement_primarySector_idx" ON "Agreement"("primarySector");

-- CreateIndex
CREATE INDEX "Agreement_signedDate_idx" ON "Agreement"("signedDate");

-- CreateIndex
CREATE INDEX "Agreement_deletedAt_idx" ON "Agreement"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_uniqueToken_key" ON "Survey"("uniqueToken");

-- CreateIndex
CREATE INDEX "Survey_agreementId_idx" ON "Survey"("agreementId");

-- CreateIndex
CREATE INDEX "Survey_editionId_idx" ON "Survey"("editionId");

-- CreateIndex
CREATE INDEX "Survey_scheduledFor_idx" ON "Survey"("scheduledFor");

-- CreateIndex
CREATE INDEX "Survey_sentAt_idx" ON "Survey"("sentAt");

-- CreateIndex
CREATE INDEX "Survey_respondedAt_idx" ON "Survey"("respondedAt");

-- CreateIndex
CREATE INDEX "SurveyResponse_surveyId_idx" ON "SurveyResponse"("surveyId");

-- CreateIndex
CREATE INDEX "SupportRequest_agreementId_idx" ON "SupportRequest"("agreementId");

-- CreateIndex
CREATE INDEX "SupportRequest_status_idx" ON "SupportRequest"("status");

-- CreateIndex
CREATE INDEX "SupportRequest_priority_idx" ON "SupportRequest"("priority");

-- CreateIndex
CREATE INDEX "SupportRequest_assignedToId_idx" ON "SupportRequest"("assignedToId");

-- CreateIndex
CREATE INDEX "StatusChange_agreementId_idx" ON "StatusChange"("agreementId");

-- CreateIndex
CREATE INDEX "StatusChange_createdAt_idx" ON "StatusChange"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_slug_key" ON "Report"("slug");

-- CreateIndex
CREATE INDEX "Report_editionId_idx" ON "Report"("editionId");

-- CreateIndex
CREATE INDEX "Report_publishedAt_idx" ON "Report"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Edition" ADD CONSTRAINT "Edition_hostCountryId_fkey" FOREIGN KEY ("hostCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditionParticipant" ADD CONSTRAINT "EditionParticipant_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditionParticipant" ADD CONSTRAINT "EditionParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_partyAId_fkey" FOREIGN KEY ("partyAId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_signerAId_fkey" FOREIGN KEY ("signerAId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_partyBId_fkey" FOREIGN KEY ("partyBId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_signerBId_fkey" FOREIGN KEY ("signerBId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

