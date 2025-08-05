-- CreateTable
CREATE TABLE "public"."prompt_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prompt_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_categories_name_key" ON "public"."prompt_categories"("name");

-- AddForeignKey
ALTER TABLE "public"."prompt_templates" ADD CONSTRAINT "prompt_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prompt_templates" ADD CONSTRAINT "prompt_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."prompt_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
