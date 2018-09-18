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

const apiPollTimeout = 3000;
const maxStatusCheckCount = (120 * 1000) / apiPollTimeout;
let statusCheckCount = 0;

export const createSigningJob = files => dispatch => {
  const form = new FormData();
  form.append('file', files[0]);

  dispatch(uploadStarted());

  return axios
    .post(API.CREATE_JOB('ios'), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(res => {
      dispatch(jobCreated({ jobId: res.data.id }));
      checkJobStatus(res.data.id, dispatch);
    })
    .catch(err => {
      console.log(`FAIL, err = ${err.message}`);
      dispatch(jobCreationFailed());
    });
};

const checkJobStatus = (jobId, dispatch) => {
  // dispatch(uploadStarted());
  statusCheckCount += 1;

  return axios
    .get(API.CHECK_JOB_STATUS(jobId), {
      headers: { Accept: 'application/json' },
    })
    .then(res => {
      if (
        res.status === 202 &&
        res.data.status === 'Processing' &&
        statusCheckCount < maxStatusCheckCount
      ) {
        setTimeout(() => {
          checkJobStatus(jobId, dispatch);
        }, apiPollTimeout);

        return;
      }

      if (res.status === 200 && res.data.status === 'Completed') {
        console.log('WERE DONE !!!');
        console.log(`download here = ${res.data.url}`);
      }
    })
    .catch(err => {
      console.log(`error = ${err.message}`);
    });
};
