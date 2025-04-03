# NFT 데이터 뷰어

이 프로젝트는 [Origin Forge API](https://api.origin-forge.com)에서 NFT 데이터를 가져와 표시하고 저장하는 도구입니다.

## 기능

- NFT 데이터 가져오기
- 속성 및 색상 팔레트 표시
- SVG 이미지 및 JSON 메타데이터 저장
- MCP(Model Context Protocol) 서버 기능

## 사용 방법

### 간단한 데이터 뷰어

```bash
node src/simple-nft.js
```

### 이미지 저장 기능이 있는 강화된 뷰어

```bash
node src/enhanced-nft.js
```

### MCP 서버 실행

```bash
node build/index.js
```

## MCP 서버 기능

MCP 서버는 다음과 같은 도구들을 제공합니다:

1. `get-nft-data` - 기본 NFT 정보 가져오기
2. `get-nft-image` - NFT 이미지 데이터 가져오기
3. `get-nft-attributes` - 상세 NFT 속성 가져오기 
4. `get-color-palette` - NFT 색상 팔레트 가져오기
5. `get-enhanced-nft-view` - 향상된 NFT 뷰 표시
6. `save-nft-files` - NFT 이미지와 JSON 데이터를 파일로 저장 (매개변수: outputDir)
7. `get-random-nfts` - 여러 개의 랜덤 NFT 가져오기 (매개변수: count)

### 파일 저장 예시
`save-nft-files` 도구를 사용하면 다음 파일들이 저장됩니다:
- SVG 이미지 파일
- JSON 메타데이터 파일
- 원본 API 응답 데이터

기본 저장 경로는 `nft-output` 디렉토리이며, `outputDir` 매개변수로 변경할 수 있습니다.

### 여러 NFT 가져오기
`get-random-nfts` 도구를 사용하면 한 번에 여러 개의 랜덤 NFT를 가져올 수 있습니다.
기본값은 3개이며, `count` 매개변수로 1-5개 사이에서 지정할 수 있습니다.

## 이미지 예시

저장된 이미지는 `nft-output` 디렉토리에서 찾을 수 있습니다. 각 이미지는 SVG 형식과 JSON 메타데이터를 포함합니다.

## 개발자

이 프로젝트는 NFT 데이터를 쉽게 가져오고 표시하기 위해 개발되었습니다.

## 라이선스

ISC 