//
// Code Signing
//
// Copyright © 2018 Province of British Columbia
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Created by Jason Leach on 2018-09-17.
//

export const ADD_FILE = 'ADD_FILE';

export const JOB_STATUS = {
  CREATING: 'JOB_STATUS_CREATING',
  CREATED: 'JOB_STATUS_CREATED',
  PROCESSING: 'JOB_STATUS_PROCESSING',
  COMPLETED: 'JOB_STATUS_COMPLETED',
  FAILED: 'JOB_STATUS_FAILED',
};

export const API = {
  BASE_URL: () => 'http://localhost:8089',
  CREATE_JOB: platformId => `/api/v1/sign?platform=${platformId}`,
  CHECK_JOB_STATUS: jobId => `/api/v1/job/${jobId}/status`,
};
