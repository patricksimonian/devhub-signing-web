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

import React from 'react';
import PropTypes from 'prop-types';
import AuthButton from './AuthButton';
import logo from './bcgovlogo.svg';
import './Header.css';

const Header = ({ authentication }) => {
  return (
    <header>
      <img src={logo} className="header-logo" alt="logo" />
      <h1>Secure Sign</h1>
      <div className="right-push">
        <AuthButton isAuthenticated={authentication.isAuthenticated} />
      </div>
    </header>
  );
};

Header.propTypes = {
  authentication: PropTypes.object.isRequired,
};

export default Header;
