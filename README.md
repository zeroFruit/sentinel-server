# sentinel-server

## Prerequisite

- Node.js >= 10.16.0

## Quick start

- 현재 디렉토리에 이미지를 다운받을 센티넬 프로덕트 목록을 `ProductList.csv` 명으로 `csv` 디렉토리 저장합니다. 이 때 csv 형식은 아래와 같아야합니다.
```
Product,ProductID,AcquisitionDate,Size,CollectionID
Sentinel-2,L1C_T52SBD_A015902_20200323T021601,2020-03-23T02:15:59.024Z,0,3f8f7a8c-5ac0-4d30-8a8a-24fa6c1fe97d
Sentinel-2,L2A_T52SBD_A024739_20200318T021559,2020-03-18T02:16:01.024Z,7.859324,d34a6a33-fdba-4784-b8f6-dd8fb2e6e225
Sentinel-2,L1C_T52SBD_A024739_20200318T021559,2020-03-18T02:16:01.024Z,2.8041,86c1b9a5-2d96-4511-9364-f476ea059a9c
Sentinel-2,L2A_T52SBD_A015759_20200313T021601,2020-03-13T02:15:59.024Z,24.144097,224a68b3-0cd0-489b-91b8-01dec6906fb3
``` 
- 결과를 저장할 폴더 `s`를 현재 디렉토리에 생성합니다.

- `s` 폴더 아래 대상지역 이미지를 저장할 하위 디렉토리를 생성합니다. 이번 예시에서는 하위 디렉토리 이름을 `yeong-am`으로 하겠습니다.
 

### Windows

#### Powershell

- 아래의 명령어로 프로그램을 실행시킵니다.
```shell script
npm install
$env:SUBDIR="yeong-am"&&npm run bootstrap 
```

#### CMD

- 아래의 명령어로 프로그램을 실행시킵니다.
```shell script
npm install
set SUBDIR=yeong-am&&npm run bootstrap 
```
