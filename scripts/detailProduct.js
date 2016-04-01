// http://hotel-test.rsscc.com/hotel/s?startdate=20160126&enddate=20160127&st=3&hotelcode=347422&city=%E5%8C%97%E4%BA%AC&bigsrc=qunar-api-hotel
// 现在RatePlan里有担保字段，needCreditGarantee=true就是需要信用卡担保
// 提前预定字段也有，advanceBookHours是需要提前预定的小时数
fstar.detailProduct = (function() {

  var detailProduct = {
    isInitialized: false,
    viewModel: {
      roomInfos: m.prop(false),
      hotelInfo: m.prop(false),
      hotelId: m.prop(''),
      currentDate: m.prop(''),
      stayDayCount: m.prop(''),
      bigsrc: m.prop(''),
      isSoldOut: m.prop(false),

      // 立马确认
      confirm: m.prop(false),
      // 免费取消
      freecancel: m.prop(false),

      checkTime: function(){
        var self = this;
        util.reloadByTimeLocal(self.currentDate());
        if(util.isReload){
          self.currentDate( new Date() );
          return true;
        }
      },

      getloadData: function() {
        var self = this;
        self.checkTime();
        util.showLoading();

        var dataReq = {
          startdate: util.dateFormatFmt(self.currentDate(), 'yyyyMMdd'), 
          enddate: util.dateFormatFmt(util.nextDate(self.currentDate(), self.stayDayCount()), 'yyyyMMdd'),
          st: 7,
          hotelcode: self.hotelId(),
          src: self.bigsrc(),
          quickconfirm: self.confirm()? 1:0,
          freecancel: self.freecancel()? 1:0,
          from: util.NCOMMON_PARAMS.from,
          uid: util.NCOMMON_PARAMS.uid
        };
        // 追加城市参数
        util.extendCommon(dataReq);

        // alert(JSON.stringify(dataReq));
        m.request({
          url: util.INTERFACE_GETHOTELDATA,
          method: 'GET',
          data: dataReq,
          background: true
        }).then(function(result) {
          util.log(result);
          // alert(JSON.stringify(result));
          if (result && (result.status === 0) ) {
            var data = result.datas.srcPrice || [];
            if(data.length == 0){
              self.isSoldOut( true );
              self.roomInfos([]);
            } else {
              self.roomInfos(data[0].roomtypePrice || []);
              self.hotelInfo(result.datas.hotelInfo);

              if(data[0].soldout == 1){
                self.isSoldOut( true );
              } else {
                self.isSoldOut( false );
              }

              self.roomInfos().map(function(roomInfo,index){
                self['roomInfo_' + index] = m.prop(false);
                self['roomInfo_' + index + '_sub'] = m.prop(false);
              });

              self['roomInfo_' + 0](true);
            }

            util.hideLoading();
            util.redraw();
          } else {
            util.alert({content:result.msg});
          }
        }, function() {
          util.alert({
            content: '网络不给力，请稍后再试试吧',
            ok: '知道了'
          });
          util.hideLoading();
        });
      },

      goIndex: function() {
        var self = this;
        self.checkTime();
        if (util.PLATFORM.CURRENT == util.PLATFORM.HBGJ || (util.PLATFORM.CURRENT == util.PLATFORM.GTGJ) ) {
          util.closeWebView();
        } else {
          m.loadRoute('list').then(function(listApp) {
            // 是否使用url的参数 flase 为使用
            listApp.isInitialized = false;

            var checkOut = util.nextDate(self.currentDate(), self.stayDayCount());
            m.route('list', {
              checkIn: self.currentDate().getTime(),
              checkOut: checkOut.getTime(),
              city: util.NCOMMON_PARAMS.city
            }, true);
          });
        }
      },

      goOrderWrapper: function(room, product) {
        var self = this;
        if(self.checkTime()){
          self.getloadData();
          return false;
        }
        util.showLoading();
        util._getDeviceInfo().then(function() {
          if (util.DEVICE_INFO && (util.DEVICE_INFO.version == '3.1' || (util.DEVICE_INFO.version == '3.2' && util.OS == 'iOS'))) {
            util.hideLoading();
            util.alert({
              title: '暂时不能预订',
              content: '升级高铁管家后，就能预订特惠五星酒店'
            });
          } else {
            self.goOrderWrap(room, product);
          }
        });
      },

      goOrderWrap: function(room, product){
        var self = this;
        var currentDate = util.dateFormatFmt(self.currentDate(), 'yyyy-MM-dd');
        var roomCount = '10',totalPrice = 0,qtyableArr=[],roomid='', onlineprice=0,offlineprice=0;
        var ratePlanInfo=product.paramprivate.ratePlanInfo;
        var pdayPrice=product.paramprivate.dayPrice;
        totalPrice = product.totalprice;
        var guestType = 'All',quickconfirm='-1';
        for(var dayprice in pdayPrice){
          if( pdayPrice.hasOwnProperty(dayprice) ){
            var onedayprice = pdayPrice[dayprice];
            qtyableArr.push(onedayprice.left);
            // totalPrice += product.price;
            // 艺龙传roomid
            
            if(ratePlanInfo.paytype == 3){
              //3-部分付
              onlineprice += onedayprice.onlineprice;
              offlineprice += onedayprice.offlineprice;
            } 
            if(room.src == 'p2p'){
              roomid += ','+onedayprice.orderparameters.roomstatusid;
            } else {
              roomid = onedayprice.orderparameters.roomid;
            }
            var customertype = onedayprice&&onedayprice.orderparameters&&onedayprice.orderparameters.customertype;
            if(customertype){
              guestType = ''+customertype;
            }
            if(room.src == 'jltour-api-hotel' && currentDate == dayprice){
              quickconfirm = onedayprice.quickconfirm;
            }
          }
        }

        if(!guestType){
          guestType = 'All'
        }

        roomCount = Math.min.apply(Math,qtyableArr);
        // if(roomCount<10){ roomCount=10}
        // 付款类型，0-未知，1-预付，2-到付，3-部分付 4-强制担保
        // 3-部分付  onlineprice offlineprice
        //提交订单付款类型  转换成： 1-到付酒店 4-预付酒店（下单进入支付流程） 6-部分付（p2p到付）  7-担保到付
        var productType = 4;
        if(ratePlanInfo.paytype == 2){
          //除了2-到付    0-未知，1-预付 全部归结为预付
          productType = 1;
        } else if(ratePlanInfo.paytype == 3){
          productType = 6;
        }
        // 担保
        var needcreditgarantee = 0;
        if(ratePlanInfo.paytype == 2 && ratePlanInfo.needcreditgarantee == "true"){
          needcreditgarantee = 1;
          productType = 7;
        }

        var roomTypeId = room.roomTypeCode;
        if(self.bigsrc() == 'elong-api-hotel'){
          roomTypeId = roomid;
        }
        if(room.src == 'p2p'){
          roomTypeId = roomid.slice(1);
        }
        
        // var payType = productType==4 || productType == 6;
        var tags= product.tags || [];
        var guzhecancelable = 0;
        if(tags.indexOf("不可取消") > -1){
          guzhecancelable = 1;
        }
        
        var hotelInfoData={
          "needcreditgarantee": needcreditgarantee,
          "source": room.src || 'other',
          "supplierName":util.PRICESRC[self.bigsrc()] || '其他供应商',
          "roomStatusId":room.roomTypeInfo._id + "-" +ratePlanInfo._id,
          "currentDate": self.currentDate(),
          "stayDayCount": self.stayDayCount(),
          // "payType": payType,//1-到付酒店    4-预付酒店（下单进入支付流程）6-部分付
          "originalPayType":ratePlanInfo.paytype,// 付款类型，0-未知，1-预付，2-到付，3-部分付
          "onlineprice": onlineprice,
          "offlineprice": offlineprice,
          "src": room.src, // 目前会有 [ctrip | elong | qunar | jltour]-api-hotel 四个枚举值
          // ctrip-api-hotel:携程
          // qunar-api-hotel：去哪儿
          // elong-api-hotel：艺龙
          // p2p: p2p数据
          // jltour-api-hotel:深圳捷旅
          "gdsName":room.src, // 可以暂时先传和 src 相同的字符串，后期会考虑删除
          "gdsId":room.src,
          // "extraparameters": JSON.stringify(ratePlanInfo.extraparameters),
          "uId":room.roomTypeInfo._id + "-" +ratePlanInfo._id,     // 任意字符串，暂时不能为空
          // "guestinfo": '',//入住人信息
          // "method":"create",
          "guestType":guestType,//顾客类型
          // "guestName":'',  // 入住人姓名 你懂得
          // "contactPhone":'',  // 联系人电话
          // "contactName":'',// 联系人姓名
          "hotelId": room.subHotelCode.split('_').pop(),// 酒店 id , 供应商自有Id; eg: ctrip-api-hotel_483697 中的下划线后面的数字
          "hotelName": m.route.param('name') || '酒店',  // 酒店名称
          "roomTypeName":room.roomTypeInfo.roomtypename || '房型', // 房型名称 
          "breakfast":ratePlanInfo.breakfast, // 早餐数量
          "breakFastQty": product.breakfast, // 早餐数量
          // "breakFastQty":util.BREAKFASE_TYPE[ratePlanInfo.breakfast] || '多早', // 早餐数量
          "bedType":room.roomTypeInfo.bed || '单床',// 床型
          "productType": productType, // 可枚举值:  1-到付酒店    4-预付酒店（下单进入支付流程） 6-部分付   7-担保到付
          "prodId":ratePlanInfo.rateplanid,// 暂时传递和 ratePlanId 相同的值
          "roomTypeId":roomTypeId,
          "ratePlanId": ratePlanInfo.rateplanid, // 床型rateplanid
          "checkInDate":util.dateFormatFmt(self.currentDate(), 'yyyy/MM/dd'),// yyyy-MM-dd
          "checkOutDate":util.dateFormatFmt(util.nextDate(self.currentDate(), self.stayDayCount()), 'yyyy/MM/dd'),   // yyyy-MM-dd
          "roomCount": roomCount,// 预订房间数量
          "totalPrice":totalPrice,// 总价格
          "realPrice":totalPrice,// 可能有各种优惠活动，减完之后的价格，暂时和 totolPrice 传递相同值
          "cprice":Math.ceil(totalPrice),// 进位总价格
          "cancelable":"0",// 是否可取消：0  是可以取消    1是不可取消
          "hotelcode":''+m.route.param('hotelcode'),
          "quickconfirm": quickconfirm,
          "hoteladdress": self.hotelInfo().address,
          "youhui": product.youhui,
          "youhuie": product.youhuie,
          "guzhecancelable": guzhecancelable,
          "paramprivate": JSON.stringify(product.paramprivate || {})
          // "customersCount":'5',
          // "guestCount":'5',// 入住人数量
          // "lateArrDateTime": "2016/02/12 18:00:00",// 最晚到店日期 yyyy-MM-dd HH:mm:ss
          // "adultCount":'5'//成人数量
        }

        util.log(hotelInfoData);
        // console.log(hotelInfoData);

        util.storage.setItem('fstar_hotelInfo', JSON.stringify(hotelInfoData), 0);
        self.goOrder(room, product);
      },

      goOrder: function(roomRoot, product) {
        var self = this;

        if (util.userCenter.isLogin() && util.header) {
          m.route('order',{},false);
        } else {
          switch(util.PLATFORM.CURRENT) {
            case util.PLATFORM.BROWSER:
            case util.PLATFORM.WEIXIN:
            m.route('order',{},false);
            // 登录完了之后需要判断优惠券是否能够预订
            // m.route('verify', {
            //   toRoute: 'order',
            //   data: JSON.stringify({}),
            //   replaceHistory: true
            // });
            
            break;
            case util.PLATFORM.HBGJ:
            case util.PLATFORM.GTGJ:
            util.hideLoading();
            util.userCenter._doNativeLogin().then(function(isLogin) {
              if (isLogin) {
                util.showLoading();
                m.route('order',{},false);
              } else {
                util.hideLoading();
                util.alert({
                  title: '错误',
                  content: '登录失败'
                });
              }
            });

            break;
          }
        }
      },

      selectDate: function() {
        var self = this;
        self.checkTime();
        m.loadRoute('selectDate').then(function(dateSelector) {
          dateSelector.viewModel.config({
            beginDate: self.currentDate().getTime(),
            dayCount: self.stayDayCount()
          }).then(function(newDate) {
            self.currentDate(newDate.beginDate);
            self.stayDayCount(newDate.dayCount);
            window.scrollTo(0, 0);
            // 供首页使用
            util.storage.setItem('fstar_hotelDateInfo', JSON.stringify({
              checkIn: newDate.beginDate,
              checkOut: util.nextDate(newDate.beginDate, newDate.dayCount),
              stayDayCount: newDate.dayCount
            }));
            history.back();
          });
          window.scrollTo(0, 0);
          m.route('selectDate');
        });
      },

      reloadTime: function(){
        var self = this;
        var hotelDateInfo = JSON.parse(util.storage.getItem('fstar_hotelDateInfo') || "{}");

        var checkIn = hotelDateInfo.checkIn;
        var checkOut = hotelDateInfo.checkOut;
        var stayDayCount = hotelDateInfo.stayDayCount;
        // alert(JSON.stringify(hotelDateInfo));
        util.reloadByTimeLocal(checkIn);
        if(util.isReload){
          self.currentDate( new Date() );
          self.stayDayCount(1);
        } else {
          self.currentDate( (checkIn && new Date(checkIn)) || new Date() );
          self.stayDayCount(stayDayCount || 1);
        }
      },

      filter: function(filtertype){
        var self = this;
        if(filtertype==1){
          self.confirm(!self.confirm());
          self.getloadData();
        } 
        if(filtertype==2){
          self.freecancel(!self.freecancel());
          self.getloadData();
        }
      },

      toggleRoomItem: function(roomIndex) {
        var self = this;
        self.checkTime();
        var len = self.roomInfos().length;
        for(var i=0;i<len;i++){
          self['roomInfo_' + i](false);
          self['roomInfo_' + i + '_sub'](false);
        }
        self['roomInfo_' + roomIndex](true);
        self['roomInfo_' + roomIndex + '_sub'](false);

        // self['roomInfo_' + roomIndex](!this['roomInfo_' + roomIndex]());
        // self['roomInfo_' + roomIndex + '_sub'](false);
      },

      showMoreProduct: function(roomIndex) {
        var self = this;
        self.checkTime();
        self['roomInfo_' + roomIndex + '_sub'](true);
      },

      onunload: function(){
        util.log('detailProduct unload');
        var self = this;
        self.roomInfos(false);
      }
    },

    init: function() {
      var vm = detailProduct.viewModel;
      var checkIn = new Date(m.route.param('currentDate'));
      // 判断时间是否已经过今日
      util.reloadByTimeLocal(checkIn);
      if(util.isReload){
        checkIn = new Date();
      }
      vm.currentDate(checkIn);
      vm.stayDayCount(parseInt(m.route.param('stayDayCount'),10));
      vm.roomInfos(false);
      this.isInitialized = true;
    }
  };

  detailProduct.controller = function() {
    util.showLoading();
    var vm = detailProduct.viewModel;
    // 同步日期
    vm.reloadTime();
    if (!detailProduct.isInitialized) {
      util.log('detailProduct is initialized');
      detailProduct.init();
    }
    vm.hotelId(m.route.param('hotelcode'));
    vm.bigsrc(m.route.param('bigsrc'));

    var title = util.PRICESRC[vm.bigsrc()] || '其他供应商';
    var name = m.route.param('name');
    if(name){
      title += ('·'+name);
    }
    util.updateTitle(title);

    util.userCenter._checkLogin().then(function(isLogin) {
      vm.getloadData();
    });

    return detailProduct.viewModel;
  };

  detailProduct.view = function(ctrl) {
    if( ctrl.roomInfos() ){
      return m('.detailProduct-w',[
        detailProduct.filterView(ctrl),
        m('.detailProduct-filter-placeholder'),
        ctrl.isSoldOut()?
        detailProduct.soldOutView(ctrl):
        detailProduct.listView(ctrl)
        
      ]);
    } else {
      return '';
    }
  };

  detailProduct.filterView = function(ctrl) {
    return m('.detailProduct-filter', [
      m('.detailProduct-filter-date', {honclick: ctrl.selectDate.bind(ctrl)}, [
        m('.detailProduct-filter-time', [
          m('span.numFont',util.dateFormatFmt(ctrl.currentDate(), 'MM月dd日'))
        ]),
        m('.detailProduct-filter-time', [
          m('span.numFont',util.dateFormatFmt(util.nextDate(ctrl.currentDate(), ctrl.stayDayCount()), 'MM月dd日'))
        ]),
        m('.detailProduct-filter-date-count',[
          '共'+ctrl.stayDayCount()+'晚'
        ]),
        m('.common-icon-date-arrow'),
      ]),
      m('.detailProduct-filter-btns',[
        m('.detailProduct-filter-btn',{
          honclick: ctrl.filter.bind(ctrl, 1),
          className: ctrl.confirm()?'selected':''
        },'立即确认'),
        // m('.detailProduct-filter-btn',{
        //   onclick: ctrl.filter.bind(ctrl, 2),
        //   className: ctrl.freecancel()?'selected':''
        // },'免费取消')
      ])
    ]);
  };

  detailProduct.listView = function(ctrl) {
    var oneDay = ctrl.stayDayCount() == 1;

    return m('.detailProduct-list', ctrl.roomInfos().map(function(room, roomIndex) {
      var soldout = room.soldout;
      var roomTypeInfo = room.roomTypeInfo || {};
      var ratePlanPrice = room.ratePlanPrice;
      var bedCount = ratePlanPrice.length;
      var addbed = roomTypeInfo.addbed;
      var haswindow = roomTypeInfo.haswindow==="0"?'无窗':'有窗';

      if (!ctrl['roomInfo_' + roomIndex]()) {
        ratePlanPrice = [];
      } else {
        if (ctrl['roomInfo_' + roomIndex + '_sub']() === false) {
          ratePlanPrice = ratePlanPrice.slice(0, 2);
        }
      }

      var subInfos = [];
      var subbed = '';
      if(roomTypeInfo.bed && roomTypeInfo.bed.length>1){
        // subbed = '-'+roomTypeInfo.bed;
        subbed = roomTypeInfo.bed;
        subInfos.push(roomTypeInfo.bed);
      }
      if (roomTypeInfo.roomsize) {
        subInfos.push(parseInt(roomTypeInfo.roomsize) + 'm<sup>2</sup>');
      }
      subInfos = subInfos.join('·'); 

      return m('.detailProduct-li', {
        className: soldout == 1?'detailProduct-li-no':''
      }, [
        m('.detailProduct-li-head',{
          onclick: ctrl.toggleRoomItem.bind(ctrl, roomIndex)
        },[
          m('.detailProduct-li-sub', [
            m('.detailProduct-li-room-type', roomTypeInfo.roomtypename),
            m('.detailProduct-li-room-info',m.trust(subInfos))
          ]),
          m('.detailProduct-li-main', {
            className: (room.youhui == '返现')? 'detailProduct-li-main1':''
          },[
            m('span.detailProduct-li-subprice', '￥'),
            m('span.detailProduct-li-price.numFont', Math.ceil(room.price) ),
            m('i', '起'),
            m('.common_icon_packagewrap',[
              m('em.common_icon_package'),
              '返现￥'+room.youhuie
            ])
          ]),
          ratePlanPrice.length == 0?m('.common-icon-more-right1'):m('.common-icon-more-right-open'),
        ]),
        m('ul.detailProduct-li-content',ratePlanPrice.map(function(product, productIndex) {
          var psoldout = product.soldout;
          var pprice = Math.ceil(product.price) || 0;
          var ratePlanInfo = product.paramprivate.ratePlanInfo;
          // ratePlanInfo.paytype = 3; //测试部分付
          var paytype = util.PAYTYPE[ratePlanInfo.paytype] || '预付';
          // var breakfast = util.BREAKFASE_TYPE[ratePlanInfo.breakfast] || '多早';
          var breakfast = product.breakfast;
          var final_addbed = util.ADDBED[addbed] || '';

          // if(ratePlanInfo.paytype == 2 && ratePlanInfo.needcreditgarantee == "true"){
          //   paytype = '担保';
          // }
          //  calcguarantee逻辑是： 0：不担保（显示预付或者到付）  1.条件担保  2.强制担保
          if(product.calcguarantee == 1){
            paytype = '条件担保';
          } else if(product.calcguarantee == 2){
            paytype = '强制担保';
          }

          var advanceBookHours = parseInt(ratePlanInfo.advancebookhours);

          // var taglist = ['国庆特惠','管家特惠'];
          var taglist = [];
          // if(extend.tags){
          //   taglist = extend.tags;
          // }
          try{
            taglist = product.tags || [];
          }catch(e){
            taglist = [];
          }
          taglist.splice(2);

          // 假如是去哪儿  床型会不同
          if(room.src == "qunar-api-hotel"){
            subbed=ratePlanInfo.extraparameters && ratePlanInfo.extraparameters.bed;
          }
          

          // p2p 的部分付
          // var onlineprice=0,offlineprice=0,isP2P = false;
          // if(ratePlanInfo.paytype == 3){
          //   var isP2P = true;
          //   for(var dayprice in product.dayPrice){
          //     if( product.dayPrice.hasOwnProperty(dayprice) ){
          //       onlineprice += product.dayPrice[dayprice].onlineprice;
          //       offlineprice += product.dayPrice[dayprice].offlineprice;
          //     }
          //   }
          //   pprice = onlineprice;
          // }
          
          return m('li',{
            className: psoldout == 1?'detailProduct-li-content-no':''
          },[
            m('.detailProduct-room-left',{
              className:taglist.length <=0?'detailProduct-room-left1':''
            },[
              m('.detailProduct-room-left-top', [
                m('span.detailProduct-room-left-txt', [
                  subbed,
                  m('span.detailProduct-room-left-txt1', '('+breakfast+')')
                ])
              ]),
              m('.detailProduct-room-left-center', [
                // roomTypeInfo.roomtypename,
                m('span.detailProduct-room-left-paytype',paytype),
                // '（'+haswindow+'）'
              ]),
              m('.detailProduct-room-left-bottom', [
                m('.detailProduct-hotel-tags', taglist.map(function(tag) {
                  return m('span', tag)
                })),
                advanceBookHours>0?m('span.detailProduct-room-advance','需提前'+advanceBookHours+'小时预订'):''
              ]),
            ]),
            m('.detailProduct-room-center',{
              className: (product.youhui=="返现")? 'detailProduct-room-center1':''
            },[
              m('.detailProduct-room-price',[
                oneDay?'':m('span.detailProduct-room-average','均'),
                m('i','￥'),
                m('span.numFont',pprice),
                m('.common_icon_packagewrap',[
                  m('em.common_icon_package'),
                  '返现￥'+product.youhuie
                ])
              ])
            ]),
            m('.detailProduct-room-right',[
              m('.detailProduct-order-btn',{
               honclick: psoldout == 1?'':ctrl.goOrderWrapper.bind(ctrl, room, product)
              },'预订')
            ])
          ]);
        })),
        
        (function(roomIndex) {
          if (!ctrl['roomInfo_' + roomIndex]()) {
            return null;
          }

          if (ctrl['roomInfo_' + roomIndex + '_sub']() === false && bedCount > 2) {
            return m('.detailProduct-room-more-product', {onclick: ctrl.showMoreProduct.bind(ctrl, roomIndex)}, [
              '查看更多',
              m('.detailProduct-room-more-arrow..common-icon-more-down')
            ]);
          } else {
            return null;
          }
        })(roomIndex),
      ])
    }));
  };

  detailProduct.soldOutView = function(ctrl) {
    return m('.detailApp-souldout', [
      m('.common-border'),
      m('span', '很抱歉，暂时没有相关房态呢'),
      m('.detailApp-souldout-a', {honclick: ctrl.goIndex.bind(ctrl)}, '查看其他酒店'),
      m('.common-border')
    ]);
  };

  return detailProduct;

})();