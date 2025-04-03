import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from 'fs';
import path from 'path';

const BASE_URL = "https://api.origin-forge.com";
const SUBPATH = "/random";

// NFT 데이터 인터페이스
interface NftAttribute {
  trait_type: string;
  value: string | number;
}

interface NftData {
  status: string;
  data: {
    seed: number;
    baseEggNumber: number;
    imageBase64: string;
    attributes: NftAttribute[];
    jsonBase64: string;
  };
}

// 저장 결과 인터페이스
interface SaveResult {
  success: boolean;
  svgPath?: string;
  jsonPath?: string;
  rawPath?: string;
  error?: string;
}

// API 요청 함수
async function makeApiRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": "nft-viewer/1.0",
    "Accept": "application/json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making API request:", error);
    return null;
  }
}

// 속성 포맷팅 함수
function formatAttributes(attributes: NftAttribute[]): string {
  return attributes.map(attr => 
    `${attr.trait_type}: ${attr.value}`
  ).join('\n');
}

// 색상 팔레트 표시
function displayColorPalette(colorSet: string | null): string {
  if (!colorSet) return "색상 정보 없음";
  
  const colors = colorSet.split(', ');
  return colors.map(color => `■ ${color}`).join('\n');
}

// NFT 데이터 포맷팅 함수
function formatNftData(data: NftData): string {
  const nftInfo = data.data;
  
  return [
    `Status: ${data.status}`,
    `Seed: ${nftInfo.seed}`,
    `Base Egg Number: ${nftInfo.baseEggNumber}`,
    '\nAttributes:',
    formatAttributes(nftInfo.attributes),
    '\nImage & JSON data available via specific commands'
  ].join('\n');
}

// 이미지 및 JSON 저장 함수
function saveDataToFiles(nftData: NftData, outputDir: string = "nft-output"): SaveResult {
  const timestamp = Date.now();
  const seed = nftData.data.seed;
  const baseEgg = nftData.data.baseEggNumber;
  
  // 저장 디렉토리 생성
  const fullOutputDir = path.join(process.cwd(), outputDir);
  
  try {
    if (!fs.existsSync(fullOutputDir)) {
      fs.mkdirSync(fullOutputDir, { recursive: true });
    }
    
    // 파일명 생성
    const prefix = `egg${baseEgg}-${seed}-${timestamp}`;
    const svgPath = path.join(fullOutputDir, `${prefix}.svg`);
    const jsonPath = path.join(fullOutputDir, `${prefix}.json`);
    const rawPath = path.join(fullOutputDir, `${prefix}-raw.json`);
    
    // SVG 이미지 저장
    const imageData = nftData.data.imageBase64;
    if (imageData.startsWith('data:image/svg+xml;base64,')) {
      const base64Data = imageData.replace('data:image/svg+xml;base64,', '');
      const svgContent = Buffer.from(base64Data, 'base64').toString('utf-8');
      fs.writeFileSync(svgPath, svgContent);
    }
    
    // JSON 데이터 저장
    const jsonData = nftData.data.jsonBase64;
    if (jsonData.startsWith('data:application/json;base64,')) {
      const base64Data = jsonData.replace('data:application/json;base64,', '');
      const jsonContent = Buffer.from(base64Data, 'base64').toString('utf-8');
      fs.writeFileSync(jsonPath, jsonContent);
    }
    
    // 전체 응답 저장
    fs.writeFileSync(rawPath, JSON.stringify(nftData, null, 2));
    
    return {
      success: true,
      svgPath: svgPath,
      jsonPath: jsonPath,
      rawPath: rawPath
    };
  } catch (error) {
    console.error(`파일 저장 중 오류 발생:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// 서버 인스턴스 생성
const server = new McpServer({
  name: "nft-viewer",
  version: "1.0.0",
});

// MCP 도구 등록
server.tool(
  "get-nft-data",
  "Get basic NFT information",
  {},
  async () => {
    const apiUrl = `${BASE_URL}${SUBPATH}`;
    const nftData = await makeApiRequest<NftData>(apiUrl);

    if (!nftData) {
      return {
        content: [
          {
            type: "text",
            text: "NFT 데이터를 가져오지 못했습니다.",
          },
        ],
      };
    }

    const formattedData = formatNftData(nftData);

    return {
      content: [
        {
          type: "text",
          text: formattedData,
        },
      ],
    };
  },
);

server.tool(
  "get-nft-image",
  "Get NFT image data",
  {},
  async () => {
    const apiUrl = `${BASE_URL}${SUBPATH}`;
    const nftData = await makeApiRequest<NftData>(apiUrl);

    if (!nftData) {
      return {
        content: [
          {
            type: "text",
            text: "NFT 이미지 데이터를 가져오지 못했습니다.",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `NFT 이미지 (Base64):\n${nftData.data.imageBase64.substring(0, 100)}...`,
        },
      ],
    };
  },
);

server.tool(
  "get-nft-attributes",
  "Get detailed NFT attributes",
  {},
  async () => {
    const apiUrl = `${BASE_URL}${SUBPATH}`;
    const nftData = await makeApiRequest<NftData>(apiUrl);

    if (!nftData) {
      return {
        content: [
          {
            type: "text",
            text: "NFT 속성을 가져오지 못했습니다.",
          },
        ],
      };
    }

    const attributesText = nftData.data.attributes.map(attr => 
      `${attr.trait_type}: ${attr.value}`
    ).join('\n');

    return {
      content: [
        {
          type: "text",
          text: `NFT 속성:\n${attributesText}`,
        },
      ],
    };
  }
);

server.tool(
  "get-color-palette",
  "Get NFT color palette",
  {},
  async () => {
    const apiUrl = `${BASE_URL}${SUBPATH}`;
    const nftData = await makeApiRequest<NftData>(apiUrl);

    if (!nftData) {
      return {
        content: [
          {
            type: "text",
            text: "NFT 색상 팔레트를 가져오지 못했습니다.",
          },
        ],
      };
    }

    // ColorSet 속성 찾기
    const colorSetAttr = nftData.data.attributes.find(attr => attr.trait_type === "ColorSet");
    const colorSet = colorSetAttr ? colorSetAttr.value.toString() : "색상 정보 없음";
    const formattedColorSet = displayColorPalette(colorSet);

    return {
      content: [
        {
          type: "text",
          text: `NFT 색상 팔레트:\n${formattedColorSet}`,
        },
      ],
    };
  }
);

server.tool(
  "get-enhanced-nft-view",
  "Get enhanced NFT view with formatted display",
  {},
  async () => {
    const apiUrl = `${BASE_URL}${SUBPATH}`;
    const nftData = await makeApiRequest<NftData>(apiUrl);

    if (!nftData) {
      return {
        content: [
          {
            type: "text",
            text: "NFT 데이터를 가져오지 못했습니다.",
          },
        ],
      };
    }

    // ColorSet 속성 찾기
    const colorSetAttr = nftData.data.attributes.find(attr => attr.trait_type === "ColorSet");
    const colorSet = colorSetAttr ? colorSetAttr.value.toString() : "색상 정보 없음";
    const formattedColorSet = displayColorPalette(colorSet);

    const enhancedView = [
      "==== NFT 데이터 ====",
      `상태: ${nftData.status}`,
      `시드: ${nftData.data.seed}`,
      `기본 달걀 번호: ${nftData.data.baseEggNumber}`,
      "",
      "==== 속성 ====",
      formatAttributes(nftData.data.attributes),
      "",
      "==== 색상 팔레트 ====",
      formattedColorSet,
      "",
      "==== 이미지 정보 ====",
      `Base64 인코딩 이미지 (미리보기): ${nftData.data.imageBase64.substring(0, 100)}...`,
      "",
      "==== JSON 데이터 ====",
      `Base64 인코딩 JSON (미리보기): ${nftData.data.jsonBase64.substring(0, 100)}...`,
    ].join('\n');

    return {
      content: [
        {
          type: "text",
          text: enhancedView,
        },
      ],
    };
  }
);

server.tool(
  "save-nft-files",
  "Save NFT image and JSON data to files",
  {
    outputDir: z.string().default("nft-output")
  },
  async (params: { outputDir: string }) => {
    const apiUrl = `${BASE_URL}${SUBPATH}`;
    const nftData = await makeApiRequest<NftData>(apiUrl);

    if (!nftData) {
      return {
        content: [
          {
            type: "text",
            text: "NFT 데이터를 가져오지 못했습니다.",
          },
        ],
      };
    }

    const saveResult = saveDataToFiles(nftData, params.outputDir);

    if (!saveResult.success) {
      return {
        content: [
          {
            type: "text",
            text: `파일 저장 중 오류 발생: ${saveResult.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: [
            "NFT 파일이 성공적으로 저장되었습니다:",
            `SVG 이미지: ${saveResult.svgPath}`,
            `JSON 메타데이터: ${saveResult.jsonPath}`,
            `원본 데이터: ${saveResult.rawPath}`,
            "",
            `모든 파일은 '${params.outputDir}' 디렉토리에 저장되었습니다.`
          ].join('\n'),
        },
      ],
    };
  }
);

server.tool(
  "get-random-nfts",
  "Get multiple random NFTs",
  {
    count: z.number().min(1).max(5).default(3)
  },
  async (params: { count: number }) => {
    const count = params.count;
    let nfts = [];
    
    for (let i = 0; i < count; i++) {
      const apiUrl = `${BASE_URL}${SUBPATH}`;
      const nftData = await makeApiRequest<NftData>(apiUrl);
      
      if (nftData) {
        nfts.push(nftData);
      }
    }
    
    if (nfts.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "NFT 데이터를 가져오지 못했습니다.",
          },
        ],
      };
    }
    
    const formattedNfts = nfts.map((nft, index) => {
      return [
        `==== NFT #${index + 1} ====`,
        `시드: ${nft.data.seed}`,
        `기본 달걀 번호: ${nft.data.baseEggNumber}`,
        `주요 속성: ${formatAttributes(nft.data.attributes.slice(0, 3))}`,
        ""
      ].join('\n');
    }).join('\n');
    
    return {
      content: [
        {
          type: "text",
          text: `${count}개의 랜덤 NFT 데이터:\n\n${formattedNfts}`,
        },
      ],
    };
  }
);

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NFT 뷰어 MCP 서버가 stdio에서 실행 중입니다");
}

main().catch((error) => {
  console.error("main()에서 치명적 오류 발생:", error);
  process.exit(1);
});