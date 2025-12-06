import { Client, LogLevel } from "@notionhq/client";

export function getNotionClient(): Client {
  const notion_token = import.meta.env.NOTION_API_KEY;

  if (!notion_token) {
    throw new Error(
      "NOTION_API_KEY not found: NOTION_API_KEY must be set in the .env file",
    );
  }

  const notion = new Client({
    auth: notion_token,
    logLevel: LogLevel.DEBUG, // for debugging
  });

  return notion;
}

/**
 * Returns the Notion Data Source ID (API v5).
 * Falls back to NOTION_DATABASE_ID and derives the linked data source for compatibility.
 */
export async function getDataSourceId(notion: Client = getNotionClient()) {
  const envDataSourceId =
    import.meta.env.NOTION_DATA_SOURCE_ID || import.meta.env.NOTION_DATABASE_ID;

  if (!envDataSourceId) {
    throw new Error(
      "NOTION_DATA_SOURCE_ID not found: set NOTION_DATA_SOURCE_ID (preferred) or NOTION_DATABASE_ID in the .env file",
    );
  }

  const cleanId = envDataSourceId.replace(/-/g, "");

  if (cleanId.length !== 32) {
    throw new Error(
      "Invalid length of NOTION_DATA_SOURCE_ID: IDs must be 32 characters long",
    );
  }

  // If user provided a data source id, return it directly
  if (import.meta.env.NOTION_DATA_SOURCE_ID) {
    return cleanId;
  }

  // Backward compatibility: derive data source id from legacy database id
  const database = await notion.databases.retrieve({ database_id: cleanId });
  const dataSourceId = database?.data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error(
      "No data sources found for the provided NOTION_DATABASE_ID. Create a data source in Notion or set NOTION_DATA_SOURCE_ID explicitly.",
    );
  }

  return dataSourceId;
}

// Legacy helper kept for internal imports
export async function getDatabaseId(notion: Client = getNotionClient()) {
  return getDataSourceId(notion);
}
