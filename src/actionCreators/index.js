//
// DevHub
//
// Copyright © 2018 Province of British Columbia
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
// Created by Jason Leach on 2018-09-04.
//

import axios from 'axios';
import { uploadStarted, jobCreated, jobCreationFailed } from '../actions';
import { API } from '../constants';

axios.defaults.baseURL = API.BASE_URL;
axios.defaults.timeout = 30000; // 30 sec

export const createSigningJob = files => dispatch => {
  const form = new FormData();
  form.append('file', files[0]);

  dispatch(uploadStarted());

  return axios
    .post(API.CREATE_JOB('ios'), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(response => {
      dispatch(jobCreated({ jobId: response.data.id }));
    })
    .catch(err => {
      console.log(`FAIL, err = ${err.message}`);
      dispatch(jobCreationFailed());
    });
};
