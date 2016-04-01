util.DEVICE_INFO = null;

util._getDeviceInfo = function() {
  var deferred = m.deferred();
  
  if (window._nativeAPI) {
    if (util.DEVICE_INFO) {
      deferred.resolve(util.DEVICE_INFO);
    } else {
      _nativeAPI.invoke('getDeviceInfo', null, function(err, data) {
        if (err === null) {
          util.DEVICE_INFO = data;
          deferred.resolve(util.DEVICE_INFO);
        } else {
          deferred.resolve();
        }
      });
    }
  } else {
    deferred.resolve();
  }
  

  return deferred.promise;
};

util.userCenter = (function() {

  var userModule = {
    viewModel: {
      isLogin: m.prop(false),
      userMoney: m.prop('--'),
      huoliUserInfo: null,
      userInfo: m.prop({}),

      _doWebLogin: function(to) {
        m.route('verify', {
          toRoute: to,
          data: JSON.stringify({}),
          replaceHistory: true
        });
      },

      // 管家登录且不同步到p2p账号
      _doNativeLoginSimple: function() {
        var deferred = m.deferred();

        var self = this;
        _nativeAPI.invoke('login', null, function(err, data) {
          if (err === null && (data.succ == '1' || data.value === data.SUCC)) {
            self.tempGetUserInfo().then(function() {
              util._getDeviceInfo().then(function() {
                util.HUOLIUSER_INFO = self.huoliUserInfo;
                // 如果需要调用self._huoliLogin(deferred);
                deferred.resolve(true);
              });
            });
          } else {
            deferred.resolve(false);
          }
        });

        return deferred.promise;
      },

      _doNativeLogin: function() {
        var deferred = m.deferred();
        var self = this;
        _nativeAPI.invoke('login', null, function(err, data) {
          if (err === null && (data.succ == '1' || data.value === data.SUCC)) {
            self.tempGetUserInfo().then(function() {
              self._huoliLogin(deferred);
            });
          }
        });

        return deferred.promise;
      },

      

      _checkNativeLogin: function() {
        var deferred = m.deferred();
        var self = this;
        if (self.isLogin()) {
          deferred.resolve(true);
          return deferred.promise;
        }
        _nativeAPI.invoke('getUserInfo', {appName: 'hbgj', type: 'hbgj'}, function(err, data) {
          
          // 管家自身已经登录
          if (err == null && data.hbuserid) {
            data.userid = data.hbuserid;
          }
          if (err === null && (data.userid || data.phone)) {
            self.huoliUserInfo = data;
            self._huoliLogin(deferred);

          } else {

            // 管家自身没有登录，登录检测到此结束
            self.isLogin(false);
            deferred.resolve(false);

          }
        });

        return deferred.promise;
      },


      // 登录成功获取信息，或者在微信和 browser 中检测是否登录
      _getWebUserInfo: function(force) {
        var deferred = m.deferred();
        var self = this;
        // if (self.isLogin() && force === undefined) {
        // FCB15CEA57CCF82A29DA5A6745079B1D 对应10235
        // CB8475FA871C59BFC213F4EF287607F2 对应phoneid 416582  预付
        // 3EE6AB789C4DBA9321299B93403DBB66 对应 416581 到付
        // 0A45E599A9314E2A78757D92C697FCE8 对应 411957
        // 771734C2006B3CE81531055263C036E0 对应 12831915
        // 正式账号  12324363
          util.header = {p:"hbgj",Authorization:"771734C2006B3CE81531055263C036E0",phoneid:"12831915"};
          if(location.href.indexOf('103.37.151.253') > -1 || location.href.indexOf('localhost') > -1){
            util.header = {p:"hbgj",Authorization:"0A45E599A9314E2A78757D92C697FCE8",phoneid:"411957"};
          }
          /* 
           *util.header = {p:"hbgj",Authorization:"0A45E599A9314E2A78757D92C697FCE8",phoneid:"411957"};
           *sessionStorage.setItem('__header',JSON.stringify(util.header))
           *sessionStorage.removeItem('__header')
          */
          var __header = sessionStorage.getItem('__header');
          if( __header ){
            util.header = JSON.parse(__header);
          }
          
          util.HUOLIUSER_INFO={};
          util.HUOLIUSER_INFO.phone = '15392968762';
          self.isLogin(true);
          util.NCOMMON_PARAMS.uid = util.header.phoneid;
          deferred.resolve(true);
          return deferred.promise;
        // }
        
        var dataReq = {};
        util.extendProp(dataReq, util.COMMON_PARAMS);
        
        m.request({
          method: 'GET',
          // url: window.apiRootPath + '/rest/user/getAccountInfo',
          url: util.INTERFACE_GETACCOUNTINFO,
          data: {param: JSON.stringify(dataReq)},
          background: true
        }).then(function(data) {
          if (data) {
            self.isLogin(true);
            self.userInfo(data);
            if (data.vouchers !== null) {
              self.userMoney(data.vouchers);
            } else {
              self.userMoney(0);
            }

            deferred.resolve(true);
          } else {
            self.isLogin(false);
            deferred.resolve(false);
          }


          
        }, function() {

          deferred.resolve(false);
        });

        return deferred.promise;
      },


      // 使用管家的账户去登录
      _huoliLogin: function(deferred) {
        var self = this;

        util._getDeviceInfo().then(function() {
          var p = 'hbgj';
          if(util.PLATFORM.CURRENT == util.PLATFORM.GTGJ){
            p = 'gtgj';
          } 

          var authcode = self.huoliUserInfo.authcode;
          // 374701698835328/web/1456741836/FE195A23B42FC5FAF2AD07EF9C0061FC
          if(authcode.indexOf('/') > -1){
            authcode = authcode.split('/').pop();
          }

          util.header = {
            p:p,
            Authorization: authcode,
            phoneid: self.huoliUserInfo.userid
          };
          // alert("header:"+ JSON.stringify(util.header));

          self.isLogin(true);
          util.HUOLIUSER_INFO = self.huoliUserInfo;
          util.NCOMMON_PARAMS.uid = self.huoliUserInfo.userid;
          // alert(JSON.stringify(util.HUOLIUSER_INFO));
          deferred.resolve(true);
          return;

          var dataReq = {
            phone: self.huoliUserInfo.phone || '',
            huoLiUserId: self.huoliUserInfo.userid || '',
            p: util.DEVICE_INFO.p,
            authCode: self.huoliUserInfo.authcode
          };
          util.extendProp(dataReq, util.COMMON_PARAMS);

          m.request({
            method: 'POST',
            // url: window.apiRootPath + '/rest/user/huoliLogin',
            url: util.INTERFACE_HUOLILOGIN,
            data: dataReq,
            background: true
          }).then(function(data) {
            if (data.code >= 100 && data.code < 200) {
              self.isLogin(true);

              self.userInfo(data.accountInfo);

              if (data.accountInfo.vouchers !== null) {
                self.userMoney(data.accountInfo.vouchers);
              } else {
                self.userMoney(0);
              }

              util.HUOLIUSER_INFO = self.huoliUserInfo;

              deferred.resolve(true);

            } else {

              deferred.resolve(false);
              util.alert({
                title: '错误',
                content: data.msg
              });
            }
          }, function() {
            deferred.resolve(false);
          });
        });
        
      },

      // 只在管家的订单详情里面运行
      _nativeAutoLogin: function() {
        var self = this;
        var deferred = m.deferred();

        self.tempGetUserInfo().then(function() {
          self._huoliLogin(deferred);
        });

        return deferred.promise;
      },



      // 检测用户登录状态
      _checkLogin: function() {
        switch(util.PLATFORM.CURRENT) {
          case util.PLATFORM.BROWSER:
          case util.PLATFORM.WEIXIN:


          // 微信和浏览器中，使用 web 登录模式
          this._doLogin = this._doWebLogin;


          return this._getWebUserInfo();

          break;
          case util.PLATFORM.HBGJ:
          case util.PLATFORM.GTGJ:
          
          // 在管家中，使用 native 登录模式
          this._doLogin = this._doNativeLogin;

          return this._checkNativeLogin();

          break;
        }
      },

      /*
       * 因为安卓获取 userinfo 是异步的，导致登录之后 userInfo.userid 不一定能获取到，所以加个循环
       */
      tempGetUserInfo: function() {
        var deferred = m.deferred();

        var self = this;
        if (self.huoliUserInfo && self.huoliUserInfo.userid) {
          // alert(JSON.stringify(self.huoliUserInfo));
          deferred.resolve();
        } else {
          
          var timeout = null;

          function getUserInfo() {
            _nativeAPI.invoke('getUserInfo', {appName: 'hbgj', type: 'hbgj'}, function(err, data) {
              // alert(JSON.stringify(data));
              // iOS 3.2 全部返回了
              if (err == null && data.hbuserid) {
                data.userid = data.hbuserid;
              }

              if (err == null && data.userid) {

                self.huoliUserInfo = data;
                deferred.resolve();
                if (timeout) {
                  clearTimeout(timeout);
                  timeout = null;
                }
              } else {
                timeout = setTimeout(getUserInfo, 500);
              }
            });
          }

          getUserInfo();
          
        }

        return deferred.promise;

      }

    }
  };


  return userModule.viewModel;
})();