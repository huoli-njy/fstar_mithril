// http://43.241.208.207:9000/hotel/order?handler=create&header={p:%22hbgj%22,Authorization:%22FCB15CEA57CCF82A29DA5A6745079B1D%22,phoneid:%2210235%22}&data={%22pageIndex%22:%220%22,%22count%22:%2210%22}
// 非当天的默认16:00
// 当天的是默认当前小时时间
// 预付的到店时间不显示  携程必填   不实现

fstar.orderApp = (function() {

  var orderApp = {
    isInitialized: false,
    timer: null,

    viewModel: {
      isPaying: m.prop(false),
      readyToRender: m.prop(false),

      /**
       *房间当前数量 @param {Number} hotelroomNum 
       *房间数量可减 @param {Boolean} roomReduce 
       *房间数量可加 @param {Boolean} roomAdd 
       */
      hotelroomNum: m.prop(1),
      roomReduce: m.prop(false),
      roomAdd: m.prop(false),

      /**
       *最晚入住时间 @param {String} lastestDate 
       *最晚入住时间可减 @param {Boolean} lastestDateReduce 
       *最晚入住时间可加 @param {Boolean} lastestDateAdd 
       */
      lastestDate: m.prop(16),
      lastestDateReduce: m.prop(false),
      lastestDateAdd: m.prop(false),


      /**
       *床型 @param {String} bedtypePrefer 
       */
      bedtypePrefer: m.prop('对床型无要求'),
      showBedtype: m.prop(false),

      
      /**
       *入住人1 验证 @param Boolean validateCustomer1
       *入住人1 姓名 @param String dataCustomer1
       *入住人1 id @param String idCustomer1
       */
      validateCustomer_1: m.prop(true),
      dataCustomer_1: m.prop(''),
      idCustomer_1: m.prop(''),

      /**
       *已选入住人集合
       */ 
      checkInPersons: m.prop([]),

      /**
       *联系电话 验证 @param Boolean validateTel
       *联系电话 @param String dataTel
       */
      validateTel: m.prop(true),
      dataTel: m.prop(''),

      /**
       *发票 @param Boolean validateBill
       */
      validateBill: m.prop(false),

      /**
       *寄送方式 @param {Number} sendType
       */
      sendType: m.prop(0),
      
      /**
       *发票抬头 验证 @param Boolean validateInvoice
       *发票抬头 @param String dataInvoice
       *发票抬头 @param String idInvoice
       */
      validateInvoice: m.prop(true),
      dataInvoice: m.prop(''),
      idInvoice: m.prop(''),

      /**
       *收件人 验证 @param Boolean validateGuest
       *收件人 @param String dataGuest
       */
      validateGuest: m.prop(true),
      dataGuest: m.prop(''),

      /**
       *发票手机号码 验证 @param Boolean validatePhone
       *发票手机号码 @param String dataPhone
       */
      validatePhone: m.prop(true),
      dataPhone: m.prop(''),

      /**
       *详细地址 验证 @param Boolean validateAddress
       *详细地址 @param String dataAddress
       */
      validateAddress: m.prop(true),
      dataAddress: m.prop(''),

      /**
       *邮寄地址 验证 @param Boolean validateUserAddress
       *邮寄地址 @param String dataUserAddress
       *邮寄地址 @param String idUserAddress
       */
      validateUserAddress: m.prop(true),
      dataUserAddress: m.prop(''),
      idUserAddress: m.prop(''),

      /**
       *房态id @param String roomStatusId
       */
      roomStatusId: m.prop(''),

      orderId: m.prop(false),
      orderInformation: m.prop(false),

      hasRedPackets: m.prop(true),
      isShowRedPackets: m.prop(false),
      redPacketsData: m.prop(false),
      selectRedPacket: m.prop(false),
      isLoadRedPackets: m.prop(false),

      isPayDetail:m.prop(false),
      hidePayDetail: function(){
        var self = this;
        self.isPayDetail(false);
      },
      togglePayDetail: function(){
        var self = this;
        var curPayDetail = self.isPayDetail();
        self.isPayDetail(!curPayDetail);
      },

      goHistoryBack: function(){
        window.history.back();
      },

      // MM月dd日
      dateFormat: function(date) {
        if(date === ""){ return;}
        date = date.replace(/-/g,"/");
        var rdate = util.dateFormatFmt(new Date(date),"MM月dd日");
        return rdate;
      },

      addRoom: function(){
        var self = this;
        var num = self.hotelroomNum();
        if( self.roomAdd() ){
          util.alert({content:'仅剩'+self.roomCount()+'间房'});
          return;
        }
        self.hotelroomNum(++num);
        if( num >= self.roomCount()){
          self.roomAdd(true);
        }

        if(self.hotelroomNum() > 1){ self.roomReduce(false);}

        /**
         *入住人0 验证 @param Boolean validateCustomer0 
         *入住人0 姓名 @param String dataCustomer0
         */
        self['validateCustomer_'+num] = m.prop(true);
        self['dataCustomer_'+num] = m.prop('');
        self['idCustomer_'+num] = m.prop('');
      },
      reduceRoom: function(){
        var self = this;
        var num = self.hotelroomNum();
        if( self.roomReduce() ){
          util.alert({content:'至少选1间房'});
          return;
        }
        self.hotelroomNum(--num);
        if( num <= 1){ self.roomReduce(true); }
        if(self.hotelroomNum() < self.roomCount()){ self.roomAdd(false);}
      },

      addLastestDate: function(){
        var self = this;
        var num = self.lastestDate();
        if( self.lastestDateAdd() ){
          return;
        }
        self.lastestDate(++num);
        if( num >= 29){
          self.lastestDateAdd(true);
        }

        if(self.lastestDate() > 6){ self.lastestDateReduce(false);}
      },
      reduceLastestDate: function(){
        var self = this;
        var num = self.lastestDate();
        if( self.lastestDateReduce() ){
          return;
        }
        self.lastestDate(--num);
        if( num <= 6){ self.lastestDateReduce(true); }
        if(self.lastestDate() < 29){ self.lastestDateAdd(false);}
      },
      getFocus: function(key){
        var self = this;
        self[key](true);

        if (self.fixedElement) {
          self.fixedElement.style.position = 'absolute';
          self.fixedElement.style.bottom = 'auto';
          // self.fixedElement.style.display = 'none';
        }
      },
      getBlur: function(key, e){
        var self = this;
        // var value = self[key]();
        var value = e.target.value;
        self[key]( value.replace(/\s*/g,'').replace(/-/g,'') );

        if (self.fixedElement) {
          self.fixedElement.style.position = 'fixed';
          self.fixedElement.style.bottom = '0';
          // self.fixedElement.style.display = 'block';
        }
      },
      onKeyDown: function(key, e) {
        var self = this;
        self[key](e.target.value);
        
        if (e.keyCode == 13 && self.fixedElement) {
          self.fixedElement.style.position = 'fixed';
          self.fixedElement.style.bottom = '0';
        }
      },
      setBill: function(){
        var self = this;
        self.validateBill()? self.validateBill(false) : self.validateBill(true);
      },
      validateIsNull: function(val){
        return !val;
      },
      validateIsNotName: function(val){
        /**
         *1. 首先会去掉首尾的空格
         *2. 中文名格式 全中文、中间 空格 可有可无，长度2 到20位： 测试、测 试、测试王
         *3. 英文名 长度2 到20位 英文可以包含（非首个字母）/ . 空格  字母和字母中间空格只可包含一个 格式： Last/Frist Middle ，Middle前有空格，长度2到20： qgi/qq  li  aa.bb   a bb 
         *4. 中文和英文不能混合使用   
         *5. 不可包含数字
         */
        val = val.trim();
        if(val.length < 2){ return true};
        return !val || !(/^([\u4e00-\u9fa5\s]{2,20}|([a-zA-Z\/\.]+\s?)+)$/.test(val));
      },
      validateIsNotTel: function(tel){
        var telephone = tel && tel.replace(/-/g,"");
        return !telephone || !(/^((\+?86)|(\+86))?1[3|4|5|7|8][0-9]\d{8}$/.test(telephone)); 
      },
      goPay: function() {
        var self = this;
        if(self.isPaying()){
          util.alert({
            title: '请等待片刻',
            content: '正在提交订单'
          });
          return;
        }

        var errorTotal = 0;
        var dataCustomer,passengers=[],dataTel,dataInvoice,dataGuest,dataPhone,dataAddress,invoiceInfo;
        var errorMsg = '';
        // form validate
        for(var i = 1, len = self.hotelroomNum(); i<=len; i++){
          if(self.validateIsNotName( dataCustomer = self['dataCustomer_'+i]() )){
            self['validateCustomer_'+i](false);
            errorTotal++;
          } else{
            self['validateCustomer_'+i](true);
            passengers.push(dataCustomer);
          };
        }

        if(errorTotal > 0){ errorMsg += '入住人姓名、';}
        
        if(self.validateIsNotTel( dataTel = self.dataTel() )){
          self.validateTel(false);
          errorTotal++;
          errorMsg += '联系电话、';
        } else{
          self.validateTel(true);
        };

        // 发票
        if( self.validateBill() ){
          var billError = 0;
          if(self.validateIsNull( dataInvoice = self.dataInvoice() )){
            self.validateInvoice(false);
            errorTotal++;
            billError++;
          } else{
            self.validateInvoice(true);
          };


          if(self.validateIsNull( dataGuest = self.dataGuest() )){
            self.validateUserAddress(false);
            errorTotal++;
            billError++;
          } else{
            self.validateUserAddress(true);
          };

          if(self.validateIsNull( dataGuest = self.dataGuest() )){
            self.validateGuest(false);
            errorTotal++;
            billError++;
          } else{
            self.validateGuest(true);
          };
          if(self.validateIsNotTel( dataPhone = self.dataPhone() )){
            self.validatePhone(false);
            errorTotal++;
            billError++;
          } else{
            self.validatePhone(true);
          };
          if(self.validateIsNull( dataAddress = self.dataAddress() )){
            self.validateAddress(false);
            errorTotal++;
            billError++;
          } else{
            self.validateAddress(true);
          };

          invoiceInfo = {
            "mailType": self.sendType(), //邮寄类型
            "invoiceName": dataInvoice, //抬头
            "consignee": dataGuest,//联系人 
            "consigneeAddress": dataAddress,//邮寄地址 
            "consigneePhone": dataPhone//联系人电话 
          };

          if(billError>0){
            errorMsg += '发票信息';
          }
        } else {
          invoiceInfo = null;
        }
        

        if(errorTotal === 0){
          if(util.dateCount( new Date(), new Date(self.currentDate())) <= 0){
            var lastestdate = self.lastestDate();
            var nowdate = (new Date()).getHours();
            util.log(lastestdate);
            util.log(nowdate);
            if(lastestdate <= nowdate){
              util.alert({
                content: '您选择的最晚到店时间错误，请重新选择。'
              });
              return;
            }
          }
          self.isLoadRedPackets(true);
          self.isPaying(true);

          clearTimeout(orderApp.timer);
          orderApp.timer = setTimeout(function(){
            util.hideLoading();
            self.isPaying(false);
          }, 20000);


          // 不进位的总价格
          var confirmprice = self.realPrice() * self.hotelroomNum();
          // 进位后的价格
          var payPrice = self.cprice() * self.hotelroomNum();
          var offlineprice = 0;

          if(self.originalPayType() == 3) {
            // 3-部分付
            confirmprice = self.onlineprice() * self.hotelroomNum();
            payPrice = Math.ceil(self.onlineprice()) * self.hotelroomNum();
            offlineprice = self.offlineprice() * self.hotelroomNum();
          }
          // 用yyyy/MM/dd  不要用yyyy-MM-dd  ios new Date() 会报错
          var lastestBase = util.dateFormatFmt( new Date(self.checkInDate()), "yyyy/MM/dd") + ' 06:00';
          lastestBase = new Date(lastestBase);
          var lateArrDateTime = new Date(lastestBase.getTime() + 60 * 60 * 1000 * (parseInt(self.lastestDate())-6));
          lateArrDateTime = util.dateFormatFmt( lateArrDateTime, "yyyy-MM-dd hh:mm:ss");

          util.log(lateArrDateTime);

          var orderData={
            "src": '' + self.src(), // 目前会有 [ctrip | elong | qunar | jltour]-api-hotel 四个枚举值
            "gdsName":'' + self.src(), // 可以暂时先传和 src 相同的字符串，后期会考虑删除
            "gdsId":'' + self.src(),
            // "extraparameters": self.extraparameters(),
            "uId": 'uid',     // 任意字符串，暂时不能为空
            "guestinfo": '' + passengers.join(','),//入住人信息
            "method":"create",
            "guestType":'' + self.guestType(),//顾客类型//艺龙的话传Chinese其他传All
            "guestName":'' + passengers.join(','),  // 入住人姓名
            "contactPhone":'' + dataTel,  // 联系人电话
            "contactName":'' + passengers[0],// 联系人姓名
            "hotelId": '' + self.hotelId(),// 酒店 id , 供应商自有Id; eg: ctrip-api-hotel_483697 中的下划线后面的数字
            "hotelName": '' + self.hotelName(),  // 酒店名称
            "roomTypeName": '' + self.roomTypeName(), // 房型名称 
            "breakfast":'' + self.breakfast(), // 早餐数量
            "breakFastQty":'' + self.breakFastQty(), // 早餐数量
            "bedType": '' + self.bedType(),// 床型
            "ratePlanId": '' + self.ratePlanId(), // 价格计划，对应的 酒店详情中 rateplancode 的值
            "productType": '' + self.productType(), // 可枚举值:  1-到付酒店    4-预付酒店（下单进入支付流程） 6-部分付  7-担保
            "prodId":'' + self.prodId(),// 暂时传递和 ratePlanId 相同的值
            "roomTypeId":'' + self.roomTypeId(),//暂时传递和 ratePlanId 相同的值
            "checkInDate":'' + self.checkInDate().replace(/\//g, '-'),// yyyy-MM-dd
            "checkOutDate":'' + self.checkOutDate().replace(/\//g, '-'),   // yyyy-MM-dd
            "roomCount": '' + self.hotelroomNum(),// 预订房间数量
            "totalPrice": '' + payPrice,// 进位总价格
            "confirmprice": '' + confirmprice,// 不进位总价格
            "realPrice": '' + payPrice,// 进位总价格 可能有各种优惠活动，减完之后的价格，暂时和 totolPrice 传递相同值
            "cancelable":'' + self.cancelable(),// 是否可取消：0  是可以取消    1是不可取消
            "customersCount":'' + self.hotelroomNum(),
            "guestCount":'' + self.hotelroomNum(),// 入住人数量
            "lateArrDateTime": '' +lateArrDateTime,// 最晚到店日期 yyyy-MM-dd HH:mm:ss  "2016-02-03 18:00:00"
            "adultCount":'' + self.hotelroomNum(),//成人数量
            "offlineprice": ''+offlineprice,
            "hotelcode":'' + self.hotelcode(),
            "bedtypeprefer":'' + self.bedtypePrefer(),
            "hoteladdress": ''+ self.hoteladdress(),
            "packetBackPrice": ''+ self.youhuie()*self.hotelroomNum(),
            "paramprivate": '' + self.paramprivate() //透传参数
          }

          if(self.quickconfirm() !== '-1' && self.quickconfirm() !== 'undefined'){
            orderData.quickconfirm = '' + self.quickconfirm();
          }

          if(self.selectRedPacket()){
            orderData.redenvelopeid = ''+self.selectRedPacket().id;
          }

          // console.log(orderData);
          // return;

          // if (self.productType() == '1') {
          //   orderData.collectPrice = self.roomCollectPrice() * self.hotelroomNum();
          // }
          // orderData.orderEntry = 0;
          if(invoiceInfo){ 
            orderData["isNeedInvoice"] = 'true';
            orderData["invoiceTitle"] = ''+invoiceInfo.invoiceName;
            orderData["invoiceAddress"] = ''+invoiceInfo.consigneeAddress;
            // orderData["recipietPostalCode"] = true;
            orderData["recipietName"] = ''+invoiceInfo.consignee;
            orderData["recipietPhone"] = ''+invoiceInfo.consigneePhone;
          } else {
            orderData["isNeedInvoice"] = 'false';
          }
          // orderData.orderFrom = util.PLATFORM.CURRENT;

          util.log(orderData);
          // console.log(orderData);
          // return false;
          util.showLoading();

          if (util.PLATFORM.CURRENT == util.PLATFORM.HBGJ || util.PLATFORM.CURRENT == util.PLATFORM.GTGJ) {
            util._getDeviceInfo().then(function(device) {
              if (util.DEVICE_INFO) {
                var uid = util.DEVICE_INFO.uid;
                if(uid){ orderData.uid = ''+uid; }
                util.userCenter.tempGetUserInfo().then(function() {
                  // orderData.huoLiUserId = util.userCenter.huoliUserInfo.userid;
                  // orderData.p = util.DEVICE_INFO.p;
                  // orderData.huoLiUid = util.userCenter.huoliUserInfo.uid;
                  // orderData.authCode = util.userCenter.huoliUserInfo.authcode;
                  self.realPay(orderData);
                });
              } else {
                util.alert({
                  title: '获取用户信息失败',
                  content: '请退出重新登录'
                });
                return;
              }
            });
          } else {
            // self.isPaying(false);
            // util.hideLoading();
            // util.alert({
            //   title: util.HOTEL_PLATFORM_TYPE[util.PLATFORM.CURRENT] + '无法提交订单',
            //   content: '请到航班管家或高铁管家提交订单'
            // });
            // return;
            self.realPay(orderData);
          }
          
        } else {
          errorMsg = errorMsg.replace(/、$/,"");
          util.alert({title:'信息填写错误',content: errorMsg+'填写错误。请填写'+errorMsg+'。'});
        }   
      },
      realPay: function(orderData) {
        var self = this;
        // var dataReq = {};
        // http://43.241.208.207:9000/hotel/order?handler=create&header={p:%22hbgj%22,Authorization:%22FCB15CEA57CCF82A29DA5A6745079B1D%22,phoneid:%2210235%22}&data={%22pageIndex%22:%220%22,%22count%22:%2210%22}
        
        // dataReq.handler="create";
        // dataReq.header=JSON.stringify(util.header);
        // dataReq.data=JSON.stringify(orderData);
        var dataReq = '';
        dataReq +='handler=create&';
        dataReq +='header='+JSON.stringify(util.header)+'&';
        dataReq +='data='+JSON.stringify(orderData);
        // console.log(encodeURI(dataReq));
        // alert(JSON.stringify(util.header));
        // alert(JSON.stringify(dataReq));
        m.request({
          method: 'post',
          // url: window.apiRootPath + '/hotel/order?handler=create'+'&header='+header+'&data='+JSON.stringify(data)',
          url: util.INTERFACE_ADDORDERDATA,
          data: encodeURI(dataReq),
          background: true
        }).then(function(data) {
          // alert(JSON.stringify(data));
          util.log(data);
          clearTimeout(orderApp.timer);
          // 101  担保  提示刷新本页面  102 变价  退回详情   103关房  跳详情  200 其他 留在本页面
          if (data && data.code == '100' ) {
            // _czc.push(﻿['_trackEvent', '订单页','订单页:下单成功', util.COMMON_PARAMS.comm_cityName +':'+util.PLATFORM.CURRENT_STR+':'+util.OS]);
            
            // 增加常用入住人
            // self.updatePassengers();

            // 增加常用发票抬头
            // if( self.validateBill() && self.dataInvoice() ){
            //   self.updateBill( self.dataInvoice().trim() );
            // }
            // 1-到付酒店 4-预付酒店（下单进入支付流程）    6-部分付（p2p到付）  7-担保到付
            var payType = orderData.productType==4 || orderData.productType == 6 || orderData.productType == 7;
            if (payType && data.data.hotelorderid && (util.PLATFORM.CURRENT == util.PLATFORM.HBGJ || util.PLATFORM.CURRENT == util.PLATFORM.GTGJ)
            ) {
              // setTimeout(function() {
              self.nativePay(data, orderData);
              // }, 1000);
              return;
            } else {
              self.isPaying(false);
              m.route(['myOrderDetail', data.data.flyorderid, data.data.gdsorderid ||'-10001', data.data.gdsid].join('/'), {}, true);

              // util.alert({
              //   title: '下单成功',
              //   content: '后期会跳转到订单详情'
              // });
              // util.hideLoading();
              // m.route('myOrderDetail/' + data.orderInfo.orderId, {}, true);
            }

            // var payShowData = {
            //   hotelId: self.hotelId(),  //酒店Id
            //   currentDate: self.currentDate().getTime(),
            //   stayDayCount: self.stayDayCount(),
            //   // totalPrice: self.totalPrice()*self.hotelroomNum(),//总价格
            //   totalPrice: orderData.payPrice,
            //   name: self.name(),
            //   roomCount: self.hotelroomNum(),
            //   roomType: self.roomType(),
            //   orderTime: new Date(data.orderInfo.orderTime).getTime(),
            //   nowTime: new Date(data.orderInfo.nowTime).getTime(),
            //   breakFastQty: self.breakFastQty(), //单早
            //   keepOrderTime: data.orderInfo.keepOrderTime
            // };
            
            // util.messageBox.hide();


            // setTimeout(function() {
            //   m.route('pay', {
            //     orderId: data.orderInfo.orderId,
            //     data: JSON.stringify(payShowData)
            //   }, true);

            // }, 200);
          } else if(data && data.code == '101' ) {
            util.hideLoading();
            // util.alert({title:'担保',content: data.msg});
            // 需要付担保金
            util.confirm({
              title: '需支付保证金￥'+orderData.realPrice,
              content: '由于房源紧张，需要进行付费担保。请问是否继续支付担保金额并下单。',
              ok:'继续预订',
              cancel:'返回'
            }).then(function(message){
              if(message == 'ok'){
                // alert(JSON.stringify(data));
                orderData.productType = '7'; 
                // self.productType(7);
                self.realPay(orderData);
              } else if(message == 'cancel'){
                self.isPaying(false);
                // 1-到付酒店 4-预付酒店（下单进入支付流程） 6-部分付（p2p到付）  7-担保到付
                self.productType(7);
                // 付款类型 1-预付，2-到付，3-部分付   到付担保
                self.originalPayType(2);
                util.redraw();
              }
            });
          } else if(data && data.code == '102' ) {
            util.hideLoading();
            self.isPaying(false);
            util.alert({
              title:'房型价格发生变化',
              content: data.msg
            }).then(function(){
              util.notice({
                content: '正在为您查询最新的报价',
                timeout: 3000,
                icon: true
              }).then(function(){
                history.back();
              });
            });
          } else if(data && data.code == '103' ) {
            util.hideLoading();
            self.isPaying(false);
            util.alert({
              title:'提交订单失败',
              content: data.msg
            }).then(function(){
              util.notice({
                content: '正在为您查询最新的报价',
                timeout: 3000,
                icon: true
              }).then(function(){
                history.back();
              });
            });
          } else if(data && data.code == '200' ) {
            util.hideLoading();
            self.isPaying(false);
            util.alert({
              title:'提交订单失败',
              content: data.msg
            }).then(function(){
              // history.back();
            });
          } else {
            util.hideLoading();
            self.isPaying(false);
            util.alert({title:'提交订单失败',content: data.msg});
          }
        }, function() {
          clearTimeout(orderApp.timer);
          util.messageBox.hide();
          self.isPaying(false);
          
          util.alert({
            content: '网络不给力，请稍后再试试吧',
            ok: '知道了'
          });
          util.hideLoading();
        });
      },
      nativePay: function(data, orderData) {
        var self = this;
        _nativeAPI.invoke('startPay', {
          quitpaymsg: util.NO_PAY_NOTICE_NATIVE,
          title: '支付 - ' + self.hotelName(),
          price: data.data.realpayprice,
          orderid: data.data.hotelorderid,
          productdesc: '伙力五星级酒店',
          subdesc: '支付 - ' + self.hotelName(),
          // canceltype: 1,
          // window.domainName
          // http://43.241.208.207:9000/hotel1
          url: window.apiRootPath + '/nativeOrderPreview.html?orderInfo=' + encodeURIComponent(JSON.stringify({
            n: orderData.hotelName,
            ci: orderData.checkInDate,
            co: orderData.checkOutDate,
            r: self.roomTypeName(),
            b: self.breakFastQty(),
            rc: orderData.roomCount,
            pt: orderData.productType, //1-到付酒店 4-预付酒店（下单进入支付流程） 6-部分付（p2p到付）  7-担保到付
            rp: data.data.realpayprice,// 付款价格
            olp: orderData.offlineprice //到付
          }))
        }, function(err, nativeData) {
          setTimeout(function(){
            self.isPaying(false);
            util.hideLoading();
            if (nativeData.value === nativeData.SUCC) {

              // util.userCenter._getWebUserInfo(true);
              // m.route('myOrderDetail/' + data.data.flyorderid, {
              //   from: 'nativePay',
              //   flyOrderId:data.data.flyorderid,
              //   gdsOrderId:data.data.gdsorderid,
              //   gdsId:data.data.gdsid
              // }, true);
              m.route(['myOrderDetail', data.data.flyorderid, data.data.gdsorderid ||'-10001', data.data.gdsid].join('/'), {
                from: 'nativePay',
                nativesucc: 1
              }, true);
              
            } else if(nativeData.value === nativeData.FAIL) {
              /*
               * 特殊说明： 支付模块会一直监听支付结果，直到支付成功；否则就是用户 cancel 了。不存在 FAIL 这个
               */
              util.messageBox.hide();
              m.route(['myOrderDetail', data.data.flyorderid, data.data.gdsorderid ||'-10001', data.data.gdsid].join('/'), {
                from: 'nativePay'
              }, true);

            } else if (nativeData.value === nativeData.CANCEL) {
              // _czc.push(﻿['_trackEvent', '订单页','订单页:支付失败', 'cancel:'+util.COMMON_PARAMS.comm_cityName +':'+util.PLATFORM.CURRENT_STR+':'+util.OS]);

              util.messageBox.hide();

              // 如果有 orderId，不需处理，因为本来就是订单编辑
              if (self.orderId()) {
                return;
              }
              // 与修改订单一致
              self.orderId(false);
              m.route(['myOrderDetail', data.data.flyorderid, data.data.gdsorderid ||'-10001', data.data.gdsid].join('/'), {
                from: 'nativePay'
              }, true);

            } else {
              // _czc.push(﻿['_trackEvent', '订单页','订单页:支付失败', 'other:'+util.COMMON_PARAMS.comm_cityName +':'+util.PLATFORM.CURRENT_STR+':'+util.OS]);
              util.messageBox.hide();
              m.route(['myOrderDetail', data.data.flyorderid, data.data.gdsorderid ||'-10001', data.data.gdsid].join('/'), {
                from: 'nativePay'
              }, true);
            }
          },2000);
        });
      },

      getUserName: function(idx, key, validateKey, idKey){
        var self = this;
        self.checkInPersons([]);
        var eles = document.querySelectorAll('#orderApp-form-person-names .orderApp-form-person-passengers');
        for(var i=0,len=eles.length; i<len; i++){
          self['validateCustomer_'+(i+1)](true);
          var dataText = eles[i].value.trim();
          if(dataText && (self.checkInPersons().indexOf(dataText) == -1) ){
            self.checkInPersons().push(dataText);
          }
        }

        m.loadRoute('userPassengers').then(function(userPassengers){
          // setTimeout(function(){
            util.showLoading();
            util.storage.setItem('fstar_passengers',JSON.stringify( self.checkInPersons()) );
            userPassengers.config({ maxNum: self.hotelroomNum() },{}).then(function(msg){
              for(var i=1,len = self.hotelroomNum(); i <= len; i++){
                self['validateCustomer_'+i] = m.prop(true);
                self['dataCustomer_'+i] = m.prop('');
                self['idCustomer_'+i] = m.prop(i);
              }
              for(var i=1,len = msg.result.length; i <= len; i++){
                self['dataCustomer_'+i] = m.prop(msg.result[i-1]);
              }
              util.storage.removeItem('fstar_passengers');
            });
            m.route('userPassengers',{
              from:'order'
            });
          // }, 200);
        });
      },
      getUserBill: function(key, validateKey, idKey){
        var self = this;
        self[validateKey](true);
        m.loadRoute('userBill').then(function(userBill){
          // setTimeout(function(){
            util.showLoading();
            util.storage.setItem('fstar_bill', self[key]() );
            userBill.config({},{}).then(function(msg){
              self[key](msg.result);
              // self[idKey](msg.id);
              // m.redraw();
              util.storage.removeItem('fstar_bill');
            });
            m.route('userBill',{
              from:'order'
            });
          // }, 200);
        });
      },
      getUserAddress: function(key, validateKey, idKey){
        var self = this;
        self[validateKey](true);
        m.loadRoute('userAddress').then(function(userAddress){
          // setTimeout(function(){
            util.showLoading();
            userAddress.config({ id:self[idKey]() },{}).then(function(msg){
              self[key](msg.result);
              self[idKey](msg.id);
              var userAddressInfo = JSON.parse(msg.result);
              self.dataGuest(userAddressInfo.name);
              self.dataPhone(userAddressInfo.phone);
              self.dataAddress(userAddressInfo.address);
            });
            m.route('userAddress',{
              from:'order'
            });
          // }, 200);
        });
      },

      // 兼容老系统下订单
      dataInit: function(oldRoomStatusId){
        var vm = orderApp.viewModel;
        var curRoomStatusId = vm.roomStatusId();

        // 床型偏好设置
        // var bedType = vm.bedType();
        // if( bedType ){
        //   if(bedType.indexOf('大床') > -1 && bedType.indexOf('双床') > -1 ){
        //     // vm.bedtypePrefer('无要求');
        //     vm.showBedtype(true);
        //   } else {
        //     vm.bedtypePrefer(bedType);
        //     vm.showBedtype(false);
        //   }
        // }

        if( curRoomStatusId != oldRoomStatusId ){
          vm.hotelroomNum(1);
          vm.validateBill(false);
          vm.dataCustomer_1('');
          vm.dataTel('');

          if(util.dateCount( new Date(), new Date(vm.currentDate())) > 0){
            vm.lastestDate(16);
          } else {
            var hours = (new Date()).getHours() +1;
            if(hours < 16){ hours = 16}
            vm.lastestDate( hours );
          }
  
          // 获取上一次订单信息
          vm.loadAccountGuests();

          // 首次进入默认无要求
          vm.bedtypePrefer('对床型无要求');
          // if(bedType.indexOf('大床') > -1 && bedType.indexOf('双床') > -1 ){
          //   vm.bedtypePrefer('对床型无要求');
          // }
          
          vm.hasRedPackets(false);
          vm.isShowRedPackets(false);
          vm.redPacketsData(false);
          vm.selectRedPacket(false);

          if(vm.youhui() == '返现'){
            vm.getRedPacketsData();
          } else {
            vm.hasRedPackets(false);
          }
        }

        
        
        if(util.dateCount( new Date(), new Date(vm.currentDate())) <= 0){
          var predate = vm.lastestDate();
          if(predate < 16){ predate = 16}
          var nowhours = (new Date()).getHours()+1;
          if(predate < nowhours){
            vm.lastestDate(nowhours);
          }
        }

        for(var i=1,len = vm.hotelroomNum(); i <= len; i++){
          vm['validateCustomer_'+i](true);
        }
        vm.validateTel(true);
        vm.validateInvoice(true);
        vm.validateUserAddress(true);

        vm.validateGuest(true);
        vm.validatePhone(true);
        vm.validateAddress(true);

        vm.currentDate(new Date(vm.currentDate()));
        vm.stayDayCount(window.parseInt(vm.stayDayCount(),10));

        if(vm.hotelroomNum() === 1){ 
          vm.roomReduce(true);
        } else{
          vm.roomReduce(false);
        }
        if(vm.hotelroomNum() === vm.roomCount()){ 
          vm.roomAdd(true);
        } else {
          vm.roomAdd(false);
        }

        if(vm.lastestDate() == 6){ 
          vm.lastestDateReduce(true);
        } else{
          vm.lastestDateReduce(false);
        }
        if(vm.lastestDate() == 29){
          vm.lastestDateAdd(true);
        } else {
          vm.lastestDateAdd(false);
        }

        vm.readyToRender(true);
        util.hideLoading();
        util.redraw();
      },

      // 获取用户手机号
      loadAccountGuests: function() {
        var self = this;
        if(util.HUOLIUSER_INFO && util.HUOLIUSER_INFO.phone){
          orderApp.viewModel.dataTel(util.HUOLIUSER_INFO.phone);
        }

        // 发票
        self.validateBill(false);
        self.dataInvoice('');
        self.dataAddress('');
        self.dataGuest('');
        self.dataPhone('');
      },

      // 增加常用入住人
      updatePassengers: function(){
        var self = this;
        var data = {
          passengers:[]
        };
        for(var i = 1, len = self.hotelroomNum(); i<=len; i++){
            data.passengers.push({ "name": self['dataCustomer_'+i]()});
        }
        
        var dataReq = data;
        util.extendProp(dataReq, util.COMMON_PARAMS);

        m.request({
          method: 'POST',
          url: util.INTERFACE_SAVEORUPDATEPASSENGER,
          data: dataReq,
          background: true
        });

      },

      // 增加常用发票抬头
      updateBill: function(bill){
        var self = this;
        var data = {
          name:bill
        };
        var dataReq = data;
        util.extendProp(dataReq, util.COMMON_PARAMS);

        m.request({
          method: 'POST',
          url: util.INTERFACE_SAVEORUPDATEINVOICE,
          data: dataReq,
          background: true
        });

      },

      // 特殊要求（床型）
      goDemand: function(){
        var self = this;
        m.loadRoute('demand').then(function(demand){
          demand.config({ type: self.bedtypePrefer() }).then(function(msg){
            self.bedtypePrefer(msg.type);
            window.history.back();
          });
          m.route('demand',{
            from:'order',
            // supplierName: self.supplierName()
          });
        });
      },

      getRedPacketsData: function(){
        var self = this;
        // http://hotel.huoli.com/rest/redenvelope/getUserRedEnvelope?huoliUserId=10235&status=1
        var huoliUserId = util.header.phoneid;
        m.request({
          url: window.domainName+'/rest/redenvelope/getUserRedEnvelope?huoliUserId='+huoliUserId+'&status=1',
          method: 'GET'
        }).then(function(result) {
          self.hasRedPackets(true);
          if(result.code == 100){
            var redEnvelopes = result.redEnvelopes;
            if(redEnvelopes && redEnvelopes.length > 0){
              self.redPacketsData(redEnvelopes);
            } else {
              self.redPacketsData(false);
            }
          } else {
            self.redPacketsData(false);
          }
          self.isLoadRedPackets(false);
          util.redraw();
          
        }, function() {
          util.alert({
            content: '网络不给力，请稍后再试试吧',
            ok: '知道了'
          });
          util.hideLoading();
        });
      },
      getRedPacketsDataLoad: function(){
        var self = this;
        // http://hotel.huoli.com/rest/redenvelope/getUserRedEnvelope?huoliUserId=10235&status=1
        var huoliUserId = util.header.phoneid;
        m.request({
          url: window.domainName+'/rest/redenvelope/getUserRedEnvelope?huoliUserId='+huoliUserId+'&status=1',
          method: 'GET'
        }).then(function(result) {
          if(result.code == 100){
            var redEnvelopes = result.redEnvelopes;
            if(redEnvelopes && redEnvelopes.length > 0){
              self.redPacketsData(redEnvelopes);
              self.isShowRedPackets(true);
            } else {
              self.redPacketsData(false);
              self.isShowRedPackets(false);
            }
          } else {
            self.redPacketsData(false);
            self.isShowRedPackets(false);
          }
          self.isLoadRedPackets(false);
          util.redraw();
          
        }, function() {
          util.alert({
            content: '网络不给力，请稍后再试试吧',
            ok: '知道了'
          });
          util.hideLoading();
        });
      },

      showRedPackets: function(){
        var self = this;
        if(self.isLoadRedPackets()){
          self.getRedPacketsDataLoad();
        } else {
          self.isShowRedPackets(true);
          util.redraw();
        }
      },
      hidePacket: function(){
        var self = this;
        self.isShowRedPackets(false);
      },
      chooseRedPacket: function(redpacket, index){
        var self = this;
        self.selectRedPacket(redpacket);
        self.isShowRedPackets(false);
      },

      deleteInput: function(key){
        var self = this;
        self[key]('');
      },

      onunload: function(){
        var self = this;
        self.fixedElement = null;
        self.isPaying(false);
        self.hidePayDetail(false);
      }
    },

    init: function() {
      this.isInitialized = true;
    }

  };

  orderApp.controller = function() {
    util.showLoading();
    document.querySelector('#main').innerHTML = '';
    if (!orderApp.isInitialized) {
      orderApp.init();
    }

    orderApp.viewModel.readyToRender(false);
    orderApp.viewModel.isPaying(false);
    
    util.updateTitle('酒店预订');
    document.querySelectorAll('body')[0].style.backgroundColor = '';
    util.userCenter._checkLogin().then(function(isLogin) {
      orderApp.reinit();
    });
    return orderApp.viewModel;
  };

  orderApp.reinit = function() {
    orderApp.viewModel.orderId(false);
    orderApp.viewModel.checkInPersons([]);
    // 是否为同一订单
    var oldRoomStatusId = orderApp.viewModel.roomStatusId();
    util.log('老的床型id:'+oldRoomStatusId);
    // 从localStorage/cookie里读取数据
    util.extend(orderApp.viewModel, JSON.parse(util.storage.getItem('fstar_hotelInfo') || '{}'));
    util.log(orderApp.viewModel.roomStatusId());
    orderApp.viewModel.dataInit(oldRoomStatusId);
  };

  orderApp.view = function(ctrl) {
    if (!ctrl.readyToRender()) {
      return;
    }
    return [
      orderApp.inforView(ctrl),
      m('.orderApp-box-10',[
        m('.common-border')
      ]),
      orderApp.formView(ctrl),
      orderApp.payView(ctrl),

      ctrl.isPayDetail()?orderApp.payDetailView(ctrl):'',
      ctrl.isShowRedPackets()?orderApp.redPacketsView(ctrl):'',
    ];
  };


  orderApp.inforView = function(ctrl) {
    return m('.orderApp-infor',[
      m('.orderApp-infor-main',[
        m('.orderApp-infor-main-name', 
          ctrl.hotelName()
        ),
        m('.orderApp-infor-main-p',[
          m('span.orderApp-date-txt','入住'),
          m('span.orderApp-date-time', [
            m('span.numFont',util.dateFormatFmt(ctrl.currentDate(), 'MM/dd') ),
            '（'+util.getCurrentWeek(ctrl.currentDate())+'）'
          ]),
          m('span.orderApp-date-txt.orderApp-date-outtime','离店'),
          m('span.orderApp-date-time', [
            m('span.numFont', util.dateFormatFmt( util.nextDate(ctrl.currentDate(), ctrl.stayDayCount()), 'MM/dd') ),
            '（'+util.getCurrentWeek( util.nextDate(ctrl.currentDate(), ctrl.stayDayCount()) )+'）'
          ])
        ]),
        m('.orderApp-infor-main-p', [
          m('span.orderApp-date-txt', [ctrl.roomTypeName() + '·' + ctrl.bedType() + '·' + ctrl.breakFastQty() + '·共' + ctrl.stayDayCount()+'晚'])
        ])
      ])
    ]);
  };

  orderApp.formView = function(ctrl) {
    // payType  1-到付酒店    4-预付酒店（下单进入支付流程）
    // originalPayType 付款类型，1-预付，2-到付，3-部分付
          
    var finalRealPay = 0;
    // var offlineprice = 0; //部分付线下价钱
    var finalIsShowInvoice = false;
    var invoiceTxt = ''; //发票说明文字

    try{
      if (ctrl.originalPayType() == 1) {
        // 1-预付
        finalRealPay = ctrl.cprice() * ctrl.hotelroomNum();
        if(finalRealPay >= 50){
          finalIsShowInvoice = true;
          invoiceTxt = '发票在您离店后邮寄，不需要向酒店前台申请';
        } else {
          finalIsShowInvoice = false;
          invoiceTxt = '满50后向客服申请（可累计）';
        }

      } else if(ctrl.originalPayType() == 2) {
        // 2-到付 
        finalRealPay = ctrl.cprice() * ctrl.hotelroomNum();
        finalIsShowInvoice = false;
        invoiceTxt = '请到店后向酒店前台申请房费发票';
      } else if(ctrl.originalPayType() == 3) {
        // 3-部分付
        finalRealPay = Math.ceil(ctrl.onlineprice()) * ctrl.hotelroomNum();
        // offlineprice = ctrl.offlineprice() * ctrl.hotelroomNum();
        if(finalRealPay >= 50){
          finalIsShowInvoice = true;
          invoiceTxt = '房费发票:请在酒店前台申请/服务费发票:填写后邮寄';
        } else {
          finalIsShowInvoice = false;
          invoiceTxt = '房费发票:请在酒店前台申请/服务费发票:满50后向客服申请（可累计）';
        }
      } else {
        // 预付
        finalRealPay = ctrl.cprice() * ctrl.hotelroomNum();
        if(finalRealPay >= 50){
          finalIsShowInvoice = true;
          invoiceTxt = '发票在您离店后邮寄，不需要向酒店前台申请';
        } else {
          finalIsShowInvoice = false;
          invoiceTxt = '满50后向客服申请（可累计）';
        }
      }

    }catch(e){

    }
    var lastestTime = ctrl.lastestDate()%24;
    var lastestDate = util.dateFormatFmt( ctrl.checkInDate(), "yyyy/MM/dd");
    if(lastestTime <= 5){
      lastestDate = util.dateFormatFmt( util.nextDate(new Date(lastestDate),1), "yyyy/MM/dd");
    }

    // 红包返现价格前端计算
    var num = ctrl.hotelroomNum();
    var totalPrice = num*ctrl.cprice();
    var redpacketPrice=0;
    if(ctrl.productType() == 1){
       // 到付
       redpacketPrice= Math.ceil(totalPrice*0.08);
    } else {
       // 预付
       redpacketPrice= Math.ceil(totalPrice*0.03);
    }

    return m('.orderApp-form', [
        // 入住人信息
        m('.common-table2.mt0', [
          m('.common-border'),
          m('ul.common-table2-list', [
            m('li.clearfix', [
              m('span.label', '房间数'),
              m('span.content', [
                m('span.orderApp-form-room-num', ctrl.hotelroomNum()),
                m('span.orderApp-form-room-num-input', [
                  m('span.orderApp-form-room-num-input-reduce', {className: ctrl.roomReduce() ? 'no-tap' : '', onclick: ctrl.reduceRoom.bind(ctrl)}),
                  m('span.orderApp-form-room-num-input-add', {className: ctrl.roomAdd() ? 'no-tap' : '', onclick: ctrl.addRoom.bind(ctrl)}),
                ])
              ])
            ]),
            // 中文  英文  /  至少两个字以上  .   中间空格   姓名，1间房填1个人
            m('li.clearfix#orderApp-form-passengers', [
              m('span.label', '入住人'),
              m('span.content.orderApp-multiselect', [
                m('span.orderApp-form-person-names#orderApp-form-person-names',
                  (function(ctrl){
                    var result = [];
                    for(var i=1,len = ctrl.hotelroomNum(); i <= len; i++){
                      result.push(m('span.orderApp-form-person-name',{ className : ctrl['validateCustomer_'+i]()?'':'orderApp-form-error' },[
                        m('input.orderApp-form-person-passengers',{
                          type:'text', 
                          autocomplete:"off",
                          placeholder: '请填入住人真实姓名',
                          value: ctrl['dataCustomer_'+i](),
                          onfocus: ctrl.getFocus.bind(ctrl, 'validateCustomer_'+i),
                          onkeyup: ctrl.onKeyDown.bind(ctrl, 'dataCustomer_'+i),
                          onblur: ctrl.getBlur.bind(ctrl, 'dataCustomer_'+i)
                        })
                      ]));
                    }
                    return result;
                  })(ctrl)
                ),
                m('span.orderApp-addition',{
                  honclick: ctrl.getUserName.bind(ctrl)
                },[
                  m('span.orderApp-addition-txt','选择旅客')
                ])
              ])
            ]),

            m('li', [
              m('span.label', '联系手机'),
              m('span.content', [
                m('span.orderApp-form-column-box',{ className : ctrl.validateTel()?'':'orderApp-form-error' },[
                 m('input.orderApp-form-phone-box-input',{
                  type:'tel', 
                  autocomplete:"off", 
                  placeholder:'用于接收通知',
                  onfocus: ctrl.getFocus.bind(ctrl, 'validateTel'),
                  onkeyup: ctrl.onKeyDown.bind(ctrl, 'dataTel'),
                  onblur: ctrl.getBlur.bind(ctrl, 'dataTel'),
                  value: ctrl.dataTel()})
                ])
              ])
            ]),
            // 预付不要最晚到店时间
            (ctrl.originalPayType() == 1)?'':
            m('li.clearfix',{
              id: 'orderApp-lastest'
            }, [
              m('span.label', '最晚到店日期  (' + lastestDate +')'),
              m('span.labeltip', [
                m('.labeltip-icon', '＊'),
                '如晚于此时间，酒店不保留房间'
              ]),
              m('span.content', [
                // m('span.orderApp-form-room-lastest-time', lastestDate),
                m('span.orderApp-form-room-lastest-input', [
                  m('span.orderApp-form-room-lastest-input-reduce', {
                    className: ctrl.lastestDateReduce() ? 'no-tap' : '', 
                    onclick: ctrl.reduceLastestDate.bind(ctrl)
                  }),
                  m('.orderApp-form-room-lastest-date',[
                    util.lastestDate(ctrl.lastestDate())
                  ]),
                  m('span.orderApp-form-room-lastest-input-add', {
                    className: ctrl.lastestDateAdd() ? 'no-tap' : '', 
                    onclick: ctrl.addLastestDate.bind(ctrl)
                  }),
                ])
              ])
            ]),

            m('li', [
              m('span.label', '特殊要求'),
              m('span.content', {
                honclick: ctrl.goDemand.bind(ctrl),
              },[
                m('span.orderApp-bedtype', ctrl.bedtypePrefer()),
                m('.orderApp-arrow-right.common-icon-more-right')
              ])
            ]),
          ]),
          m('.common-border')
        ]),
        
        ctrl.hasRedPackets()?
        m('.orderApp-redpacket', {
          honclick: ctrl.redPacketsData()? ctrl.showRedPackets.bind(ctrl):'',
        },[
          m('span.orderApp-redpacket-icon.common_icon_packet'),
          m('.orderApp-redpacket-txt', [
            ctrl.redPacketsData()?
            ctrl.selectRedPacket()?[
              m('.orderApp-redpacket-top', [
                '高铁红包返现',
                ctrl.originalPayType() == 1? ctrl.selectRedPacket().prepayBack*100:ctrl.selectRedPacket().collectBack*100,
                '%，即',
                m('span.orderApp-redpacket-price','￥'+redpacketPrice),
              ]),
              m('.orderApp-redpacket-bottom', '离店后，￥'+redpacketPrice+'现金将返入您的高铁账号'),
            ]:'请选择要使用的红包':[
              m('.orderApp-redpacket-top', '您没有可用的高铁管家红包'),
              m('.orderApp-redpacket-bottom', '您在高铁管家购买火车票后,会获赠红包'),
            ],
          ]),
          m('.orderApp-arrow-right.common-icon-more-right')
        ]):'',

        // 部分付
        (ctrl.productType() == 6) ?
          m('.orderApp-price-c.clearfix', [
            m('.common-border'),
            m('.orderApp-price-item.clearfix.item2', [
              m('.orderApp-price-item-label', '房费（到店付，发票前台取）'),
              m('.orderApp-price-item-content', '￥' + ctrl.offlineprice() * ctrl.hotelroomNum())
            ]),
            m('.orderApp-price-item.clearfix.item2', [
              m('.orderApp-price-item-label', '服务费（预付，发票邮寄）'),
              m('.orderApp-price-item-content', '￥' + ctrl.onlineprice() * ctrl.hotelroomNum())
            ]),
            m('.common-border.orderApp-price-item-spliter'),
            m('.orderApp-price-item.clearfix', [
              m('.orderApp-price-item-label.label2', '总价'),
              m('.orderApp-price-item-content', '￥' + (parseInt(ctrl.onlineprice())+parseInt(ctrl.offlineprice()) ) * ctrl.hotelroomNum())
            ]),
            m('.common-border')
          ]):null,

        // 担保
        // (ctrl.needcreditgarantee() == 1)?
        //   m('.orderApp-card-add.clearfix', [
        //     '使用新的银行卡'
        //   ]):null,


        // 发票信息
        m('.common-table2.clearfix.orderApp-table', [
          m('.common-border'),
          m('ul.common-table2-list', [
            m('li.clearfix',{
              onclick: finalIsShowInvoice?ctrl.setBill.bind(ctrl):function(){},
              id: 'orderApp-form-bill'
            }, [
              m('span.label', '发票'),
              m('span.explain',[
                m('span.explain-icon','＊'),
                invoiceTxt
              ]),
              finalIsShowInvoice?
              ctrl.validateBill() ? m('span.common-icon-square-blue') : m('span.common-icon-square-default')
              :m('span.common-icon-square-gray'),
            ])
          ]),
          m('.common-border'),

          finalIsShowInvoice?[
          m('ul.common-table2-list', { className : ctrl.validateBill()?'':'orderApp-form-none' }, [
            m('li.clearfix', [
              m('span.label.orderApp-vertical-middle', '金额'),
              m('span.content', '￥'+finalRealPay)
            ]),
            m('li.clearfix', [
              m('span.label.orderApp-vertical-middle', '发票明细'),
              m('span.content', '代订房费，由旅行社开具')
            ]),
            m('li.clearfix', [
              m('span.label.orderApp-vertical-middle', '配送方式'),
              m('span.content', [
                m('span.orderApp-inline-txt',[
                  '免费快递',
                  m('span.orderApp-sendOverTime','预计在您离店后10个工作日内送达')
                ])
              ])
            ]),
            m('li.clearfix', [
              m('span.label.orderApp-vertical-middle', '发票抬头'),
              m('span.content', [
                m('span.orderApp-form-column-box.orderApp-form-invoices',
                  { className : ctrl.validateInvoice()?'':'orderApp-form-error'},[
                      m('input.orderApp-form-invoice',{
                        type:'text', 
                        autocomplete:"off",
                        placeholder: '单位/个人名称',
                        value: ctrl['dataInvoice'](),
                        onfocus: ctrl.getFocus.bind(ctrl, 'validateInvoice'),
                        onkeyup: ctrl.onKeyDown.bind(ctrl, 'dataInvoice'),
                        onblur: ctrl.getBlur.bind(ctrl, 'dataInvoice')
                      })
                    ]

                ),
                m('span.orderApp-addition',{
                  honclick: ctrl.getUserBill.bind(ctrl,'dataInvoice','validateInvoice','idInvoice')
                },[
                  m('span.orderApp-addition-txt','选择抬头')
                ])
              ])
            ]),

            m('li', [
              m('span.label', '收件人'),
              m('span.content', [
                m('span.orderApp-form-column-box.orderApp-form-add',{ 
                  className : ctrl.validateGuest()?'':'orderApp-form-error' 
                },[
                 m('input.orderApp-form-colum-box-input',{ 
                  autocomplete:"off", 
                  placeholder:'至少两个汉字',
                  onfocus: ctrl.getFocus.bind(ctrl, 'validateGuest'),
                  onkeyup: ctrl.onKeyDown.bind(ctrl, 'dataGuest'),
                  onblur: ctrl.getBlur.bind(ctrl, 'dataGuest'),
                  value: ctrl.dataGuest()
                 })
                ]),
                m('span.orderApp-addition',{
                  honclick: ctrl.getUserAddress.bind(ctrl,'dataUserAddress','validateUserAddress','idUserAddress')
                },[
                  m('span.orderApp-addition-txt','选择地址')
                ])
              ])
            ]),
            m('li', [
              m('span.label', '手机号码'),
              m('span.content', [
                m('span.orderApp-form-column-box',{ 
                  className : ctrl.validatePhone()?'':'orderApp-form-error' 
                },[
                 m('input.orderApp-form-colum-box-input',{ 
                  type:'tel', 
                  autocomplete:"off", 
                  placeholder:'用于接收通知',
                  onfocus: ctrl.getFocus.bind(ctrl, 'validatePhone'),
                  onkeyup: ctrl.onKeyDown.bind(ctrl, 'dataPhone'),
                  onblur: ctrl.getBlur.bind(ctrl, 'dataPhone'),
                  value: ctrl.dataPhone()
                 })
                ])
              ])
            ]),
            m('li', [
              m('span.label', '地址'),
              m('span.content', [
                m('span.orderApp-form-column-box.common-form-address',{
                  className : ctrl.validateAddress()?'':'orderApp-form-error' 
                },[
                  m('input.orderApp-form-colum-box-input',{ 
                    autocomplete:"off", 
                    placeholder:'城市、街道、门牌号',
                    onfocus: ctrl.getFocus.bind(ctrl, 'validateAddress'),
                    onkeyup: ctrl.onKeyDown.bind(ctrl, 'dataAddress'),
                    onblur: ctrl.getBlur.bind(ctrl, 'dataAddress'),
                    value: ctrl.dataAddress()
                  }),
                  ctrl.dataAddress()?
                  m('.common-icon-input-cancel', {
                    onclick: ctrl.deleteInput.bind(ctrl,'dataAddress')
                  }):''
                ])
              ])
            ])
          ]),
          ctrl.validateBill()?m('.common-border'):'',
          ]:'',
        ]),

        // 规则
        m('ul.orderApp-form-list', [
          ctrl.validateBill()?
          m('li', [m('span.orderApp-icon-circle'), '发票信息提交后，不可修改。如有特殊需求，请联系客服。']
          ):'',
          ctrl.validateBill()?
          m('li', [m('span.orderApp-icon-circle'), '发票将在离店后寄出。']
          ):'', 
          ctrl.src()=='p2p'&&ctrl.productType()==6?
          m('li',{
            style: 'margin-top:0.2rem;'
          }, [
            m('span.orderApp-icon-circle'), 
            m('span',util.dateFormatFmt(ctrl.currentDate(), 'yyyy年MM月dd日')),
            ' 18:00前，可免费变更或取消订单，服务费全部原路退回。之后，取消或变更将扣除首晚服务费。']
          ):'',
          m('li', [m('span.orderApp-icon-circle'), '未标注『立即确认』的产品需等待酒店确认，如无法确认则全额退款。']
          ),
          ctrl.guzhecancelable() == '1'?m('li', [m('span.orderApp-icon-circle'), '标注『不可取消』的产品订单提交后不可取消或修改，如未预订成功，预付费用全部原路退还。']
          ):'',

          
          // m('li', [m('span.orderApp-icon-circle'), '确认前，免费取消，预付的费用全额退回。']
          // ),
          // m('li', [m('span.orderApp-icon-circle'), '成功确认后，不可取消或变更订单。'])
        ]),
        m('.h50'),
      ]);
  };

  orderApp.payView = function(ctrl) {
    var typeTxt = '', btnTxt='去支付', payTxt = '总额',finalRealPay=0;
    var onlineprice=0,offlineprice=0;
    if (ctrl.originalPayType() == 1) {
      // 1-预付
      finalRealPay = ctrl.cprice() * ctrl.hotelroomNum();
      typeTxt = '预付';

    } else if(ctrl.originalPayType() == 2) {
      // 2-到付 
      finalRealPay = ctrl.cprice() * ctrl.hotelroomNum();
      typeTxt = '到付';
      btnTxt = '提交订单';
    } else if(ctrl.originalPayType() == 3) {
      // 3-部分付
      onlineprice = ctrl.onlineprice()* ctrl.hotelroomNum();
      offlineprice = ctrl.offlineprice()* ctrl.hotelroomNum();
      finalRealPay = onlineprice+offlineprice;
      // offlineprice = ctrl.offlineprice() * ctrl.hotelroomNum();
      // typeTxt = '部分付';
      // payTxt = '服务费';
    } else {
      // 预付
      finalRealPay = ctrl.cprice() * ctrl.hotelroomNum();
      typeTxt = '预付';
    }
    // 担保
    if(ctrl.productType() == 7){
      // 到付担保 
      typeTxt = '担保';
      btnTxt = '去担保';
    }

    return m('.orderApp-pay',{
      config: function(element, isInitialized) {
      if (isInitialized) return;
      ctrl.fixedElement = element;
    }}, [
      m('.orderApp-pay-total', [
        m('.orderApp-pay-total-price',{
          className: ctrl.isPayDetail()?'show':'',
          onclick: ctrl.togglePayDetail.bind(ctrl)
        }, [
          m('span.order-pay-total-txt',payTxt),
          m('i', '￥'), 
          m('span.numFont', finalRealPay ),
          m('span.order-pay-detail-arrow')
        ]),
        (ctrl.originalPayType() == 3)?
        m('.orderApp-pay-type',[
          m('.orderApp-pay-type-item',[
            '在线付¥',
            m('span.numFont', onlineprice)
          ]),
          m('.orderApp-pay-type-item.orderApp-pay-type-item1',[
            '到店付¥',
            m('span.numFont', offlineprice)
          ])
        ]):
        m('.orderApp-pay-type',[
          typeTxt+'¥',
          m('span.numFont', finalRealPay)
        ])
      ]),
      m('.orderApp-pay-next',{
        onclick: ctrl.goPay.bind(ctrl) 
      }, btnTxt)
    ]);
  };

  orderApp.payDetailView = function(ctrl){
    var datein = util.dateFormatFmt(ctrl.currentDate(), 'MM月dd日');
    var dateout = util.dateFormatFmt( util.nextDate(ctrl.currentDate(), ctrl.stayDayCount()), 'MM月dd日');
    var daycount = ctrl.stayDayCount();
    var num = ctrl.hotelroomNum();
    var totalPrice = num*ctrl.cprice();
    var typeTxt = '预付';
    if (ctrl.originalPayType() == 2) {
      // 1-预付 2-到付 3-部分付
      typeTxt = '到付';
    } 

    if(ctrl.originalPayType() == 3) {
      // 3-部分付
      var onlineprice = Math.ceil(ctrl.onlineprice())*num;
      var offlineprice = Math.ceil(ctrl.offlineprice())*num;
      totalPrice = num*(onlineprice+offlineprice);
      return m('#payDetail',{
        className: ctrl.isPayDetail()?'show':''
      },[
        m('#payDetailBg',{
          // onclick: ctrl.hidePayDetail.bind(ctrl)
        }),
        m('#payDetailContent',[
          m('.orderApp-payDetail',[
            m('.orderApp-payDetail-title', '费用明细'),
            m('.orderApp-payDetail-date', [
              m('.orderApp-payDetail-date-left', [
                m('.orderApp-payDetail-date-intext','入住'),
                m('.orderApp-payDetail-date-in.numFont',datein),
              ]),
              m('.orderApp-payDetail-date-center', [
                m('.orderApp-payDetail-date-num',daycount+'晚·'+num+'间'),
                m('.orderApp-payDetail-date-line'),
              ]),
              m('.orderApp-payDetail-date-right', [
                m('.orderApp-payDetail-date-outtext','离店'),
                m('.orderApp-payDetail-date-out.numFont',dateout),
              ]),
            ]),
            m('.orderApp-payDetail-item',[
              m('.orderApp-payDetail-item-txt','在线付'),
              m('.orderApp-payDetail-item-num',[
                '¥',
                m('span.numFont', onlineprice )
              ]),
            ]),
            m('.orderApp-payDetail-item',[
              m('.orderApp-payDetail-item-txt','到店付'),
              m('.orderApp-payDetail-item-num',[
                '¥',
                m('span.numFont', offlineprice )
              ]),
            ]),
            m('.orderApp-payDetail-total',[
              m('.orderApp-payDetail-total-txt','订单总额'),
              m('.orderApp-payDetail-total-num',[
                '¥',
                m('span.numFont', totalPrice )
              ]),
            ]),
          ]),
        ]),
        m('.orderApp-pay-close',[
          m('.common-order-close',{
            onclick: ctrl.hidePayDetail.bind(ctrl)
          })
        ]),
      ]);
    } else {
      return m('#payDetail',{
        className: ctrl.isPayDetail()?'show':''
      },[
        m('#payDetailBg',{
          // onclick: ctrl.hidePayDetail.bind(ctrl)
        }),
        m('#payDetailContent',[
          m('.orderApp-payDetail',[
            m('.orderApp-payDetail-title', '费用明细'),
            m('.orderApp-payDetail-date', [
              m('.orderApp-payDetail-date-left', [
                m('.orderApp-payDetail-date-intext','入住'),
                m('.orderApp-payDetail-date-in.numFont',datein),
              ]),
              m('.orderApp-payDetail-date-center', [
                m('.orderApp-payDetail-date-num',daycount+'晚·'+num+'间'),
                m('.orderApp-payDetail-date-line'),
              ]),
              m('.orderApp-payDetail-date-right', [
                m('.orderApp-payDetail-date-outtext','离店'),
                m('.orderApp-payDetail-date-out.numFont',dateout),
              ]),
            ]),
            m('.orderApp-payDetail-item',[
              m('.orderApp-payDetail-item-txt','房费（'+typeTxt+'）'),
              m('.orderApp-payDetail-item-num',[
                '¥',
                m('span.numFont', totalPrice )
              ]),
            ]),
            (ctrl.productType() == 7)?
            m('.orderApp-payDetail-item',[
              m('.orderApp-payDetail-item-txt','担保（离店后原路退回）'),
              m('.orderApp-payDetail-item-num',[
                '¥',
                m('span.numFont', totalPrice )
              ]),
            ]):'',
            m('.orderApp-payDetail-total',[
              m('.orderApp-payDetail-total-txt','订单总额'),
              m('.orderApp-payDetail-total-num',[
                '¥',
                m('span.numFont', totalPrice )
              ]),
            ]),
          ]),
        ]),
        m('.orderApp-pay-close',[
          m('.common-order-close',{
            onclick: ctrl.hidePayDetail.bind(ctrl)
          })
        ]),
      ]);
    }
  };

  orderApp.redPacketsView = function(ctrl) {
    return m('.orderApp-packet.show',[
      m('.orderApp-packet-bg',{
        onclick: ctrl.hidePacket.bind(ctrl)
      }),
      m('.orderApp-packet-main',[
        m('.orderApp-packet-title', '选择高铁红包'),
        m('.orderApp-packet-items',[
          ctrl.redPacketsData().map(function(value, index){
            return m('.orderApp-packet-item',{
              className: value.id==ctrl.selectRedPacket().id? 'selected':'',
              onclick: ctrl.chooseRedPacket.bind(ctrl, value, index)
            },[
              m('.orderApp-packet-item-top','高铁红包'),
              m('.orderApp-packet-item-bottom','预付返现'+value.prepayBack*100+'%，到店付返现'+value.collectBack*100+'%，有效期至 '+value.expire),
            ]);
          })
        ])
      ])
    ]);
  };

  return orderApp;

})();