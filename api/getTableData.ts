import { getDataSourceId, getNotionClient } from "./notionClient";
import { getPlainText, getPostDate } from "./utils";

// Get metadata of the database eg. title, date
// returns the database object as response
export async function getTableHeader() {
  try {
    const notion = getNotionClient();
    const dataSourceId = await getDataSourceId(notion);
    const response = await notion.dataSources.retrieve({
      data_source_id: dataSourceId,
    });

    return response;
  } catch (error) {
    console.error(error);
  }
}

type tableProps = {
  includeDraft?: boolean;
};

// Takes props for filtering options
// Returns contents in the database
// by default, it does not include the draft posts
export async function getTableData(
  props: tableProps = { includeDraft: false },
) {
  try {
    const { includeDraft } = props;
    const notion = getNotionClient();
    const dataSourceId = await getDataSourceId(notion);

    // this filters out the draft posts by default
    const queryObj = {
      data_source_id: dataSourceId,
      ...(!includeDraft && {
        filter: {
          property: "draft",
          checkbox: {
            does_not_equal: true,
          },
        },
      }),
    };

    const response = await notion.dataSources.query(queryObj);
    const cleanedData = cleanTableData(response.results);
    return cleanedData;
  } catch (error) {
    console.error(error);
  }
}

type pageMetaData = {
  id: string;
  url: string;
  date: {
    created: string;
    edited: string;
  };
  properties: {
    title: number;
    slug: string;
  };
};

function cleanTableData(data): pageMetaData[] | [] {
  if (!data) {
    return [];
  }

  const cleanedData = data.map((page): pageMetaData => {
    const { id, created_time, last_edited_time, properties, url } = page;

    return {
      id,
      url,
      date: getPostDate(created_time, last_edited_time, properties?.date),
      properties: {
        title: getPlainText(properties?.title),
        slug: getPlainText(properties?.slug),
      },
    };
  });

  return cleanedData;
}
