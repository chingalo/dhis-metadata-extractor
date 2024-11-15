# DHIS2 Metadata Extractor

## Introduction
Script mainly to support metadata extractions from the DHIS2 system into excel formats. Currently support extraction of `indicators`, `program indicators`, `option sets`, `program rules` and `program`. For program and program rules including their dependencies, for instance program rules includes program rules actions associated while for program includes program stages with program stage sections and data elements as well as if program is tracker based including program section and tracked entity attributes.


## Pre-requiestes for the script

Below are pre-requiested for the script to be able to clone and run the script successfully. Typescript mostly for building source code into **_js bundled_** codes for running the script.

```
- GIT
- Node v20+
- npm v10+
- typescript v4+
```

## Get started with script

To get start up we need to clone or [download](https://github.com/hisptz/dhis-metadata-extractor/archive/refs/heads/develop.zip) the source codes and having better under stand of source codes for set up prior development or run the script.

To clone the app, make sure you have installed the **GIT** command line and tun below command on the terminal

`git clone https://github.com/hisptz/dhis-metadata-extractor.git`

### Setup & Configurations

Prior run the script need configurations of the script by set up acess credential to DHIS2 instance where the script will proxy to DHIS2 instance as well as set up list of programs which will be retrived **`(If list is empty, the script will retrive all programs)`**.

To set up access creadntial create the file **app-config.ts** on **_`src/configs`_** with below contents

```
import { AppConfigModel } from '../models';

export const appConfig: AppConfigModel = {
  username: 'dhis_username',
  password: 'dhis_password',
  baseUrl: 'dhis_base_url'
};

export const PROGRAM_REFERENCE = []; //List of applicable program ids if empty all programs will be fetched

```

After installation run below command to install neccessary packages for the script

```
npm install
```

## Operation of script

After set up the script and install all script's dependences, you can run the app for development purpose or deployments.

For development, inorder to tracking changes as changing source codes, you can run below command while inside the script dicectory

```
npm run dev
```

For deployment, you can run below command while inside the script dicectory

```
sh run-script.sh
```

To view script logs as the script is run or in progress, you can run below command while inside the script dicectory

```
tail -f resources/logs/logs.txt
```

**_NOTE:_** To view or access generated excel files, the script generate and store all generated excel files for metadata under this directory `resources/excels`
