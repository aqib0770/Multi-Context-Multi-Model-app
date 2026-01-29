import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

let embeddingsInstance: GoogleGenerativeAIEmbeddings | null = null;

function getEmbeddings() {
  if (!embeddingsInstance) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not defined");
    }
    embeddingsInstance = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: apiKey,
    });
  }
  return embeddingsInstance;
}

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";

export async function getVectorStore(collectionName: string = "default") {
  const embeddings = getEmbeddings();
  return await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: QDRANT_URL,
    collectionName: collectionName,
  });
}

export async function embedPDF(
  pdfPath: string | Blob,
  pointId: string | string[],
  collectionName: string = "default",
) {
  try {
    const loader = new PDFLoader(pdfPath);
    const rawDocs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.splitDocuments(rawDocs);

    const processedDocs = docs.map((doc: Document, idx: number) => {
      doc.metadata = {
        ...doc.metadata,
        pointId: Array.isArray(pointId) ? pointId[0] : pointId, // pointId usually refers to the file/source ID
        type: "pdf",
      };
      return doc;
    });

    console.log(
      `Loaded and split into ${processedDocs.length} chunks from PDF.`,
    );

    const embeddings = getEmbeddings();

    await QdrantVectorStore.fromDocuments(processedDocs, embeddings, {
      url: QDRANT_URL,
      collectionName: collectionName,
    });

    console.log(`PDF indexed for session ${collectionName}`);
  } catch (error) {
    console.error("Error embedding PDF:", error);
    throw error;
  }
}

export async function embedURL(
  url: string,
  pointId: string | string[],
  collectionName: string = "default",
) {
  try {
    const loader = new CheerioWebBaseLoader(url);
    const rawDocs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.splitDocuments(rawDocs);

    const processedDocs = docs.map((doc: Document, idx: number) => {
      doc.metadata = {
        ...doc.metadata,
        pointId: Array.isArray(pointId) ? pointId[0] : pointId,
        type: "url",
      };
      return doc;
    });

    console.log(
      `Loaded and split into ${processedDocs.length} chunks from URL.`,
    );

    const embeddings = getEmbeddings();

    await QdrantVectorStore.fromDocuments(processedDocs, embeddings, {
      url: QDRANT_URL,
      collectionName: collectionName,
    });

    console.log(`URL indexed for session ${collectionName}`);
  } catch (error) {
    console.error("Error embedding URL:", error);
    throw error;
  }
}

export async function deletePointFromCollection(
  pointId: string,
  collectionName: string = "default",
) {
  try {
    const embeddings = getEmbeddings();

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: QDRANT_URL,
        collectionName: collectionName,
      },
    );

    const filter = {
      must: [
        {
          key: "metadata.pointId",
          match: { value: pointId },
        },
      ],
    };

    await vectorStore.client.delete(collectionName, {
      filter: filter,
    });
    console.log(`Deleted all points with pointId: ${pointId}`);
  } catch (err) {
    console.error("Error deleting points from Qdrant:", err);
    throw err;
  }
}

export async function queryVectorStore(
  query: string,
  k: number = 4,
  collectionName: string = "default",
) {
  try {
    const vectorStore = await getVectorStore(collectionName);
    const results = await vectorStore.similaritySearch(query, k);
    return results;
  } catch (error) {
    console.error("Error querying vector store:", error);
    return [];
  }
}
