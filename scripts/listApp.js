fstar.listApp = (function() {

  var listApp = {
    isInitialized: false,

    viewModel: {
      city: m.prop('北京'),
      cityid: m.prop(1),
      checkIn: m.prop(new Date()),
      checkOut: m.prop(''),
      stayDayCount: m.prop(1),
      resultCode: m.prop(0),

      brands: m.prop([]),
      circles: m.prop([]),
      starLevel: m.prop(['不限']),
      priceRange: m.prop('不限'),
      sortType: m.prop('推荐排序'),
      keyword: m.prop(''),
      type: m.prop('q'),
      sid: m.prop(''),
      sids: m.prop(''),
      lat: m.prop(''),
      lon: m.prop(''),
      typeid: m.prop(''),
      // 特色 feature
      // feature: m.prop([]),
      // 行政区域 district
      // district: m.prop([]),
      cityLoc: m.prop(false),


      // 附近
      filterType1: m.prop(false),
      // 五星特惠
      filterType2: m.prop(false),
      // 地铁直达
      filterType3: m.prop(false),

      trip: m.prop(false),


      hotelList: m.prop([]),

      isFirstLoading: m.prop(false),
      noData: m.prop(false),
      isFirstLoadError: m.prop(false),
      currentPage: m.prop(0),
      isLoadingMore: m.prop(false),
      isLoadingMoreError: m.prop(false),
      isLoadingMoreNo: m.prop(false),
      isLoading: m.prop(false),

      isShowSort:m.prop(false),

      showSort: function(){
        var self = this;
        self.isShowSort(true);
      },
      hideSort: function(){
        var self = this;
        self.isShowSort(false);
      },

      checkTime: function(){
        var self = this;
        util.reloadByTimeLocal(self.checkIn());
        if(util.isReload){
          self.checkIn( new Date() );
          return true;
        }
      },

      loadFirstPage: function() {
        var self = this;
        window.scrollTo(0, 0);
        util.showLoading();
        self.currentPage(0);
        self.isFirstLoading(true);

        if(self.isLoading()){ util.log('正在请求。。。'); return;}
        self.isLoading(true);
        var loadTimer = setTimeout(function(){
          self.isLoading(false);
          util.hideLoading();
        },3000)

        self.loadData().then(function(result) {
          clearTimeout(loadTimer);
          self.isLoading(false);
          util.hideLoading();
          self.isFirstLoading(false);

          var hotels = [];
          if (result.code == 1) {
            var data = result.data;
            hotels = data.datas || [];
            var total = data.total;
            if(data.status === 0){
              self.isFirstLoadError(false);
              if ( total >= util.PS ) {
                self.isLoadingMoreNo(false);
              } else {
                self.isLoadingMoreNo(true);
              }
              self.hotelList(hotels);
            } else {
              self.hotelList([]);
              self.isLoadingMoreNo(true);
              self.isFirstLoadError(true);
            }
          } else {
            self.hotelList([]);
            self.isLoadingMoreNo(true);
            self.isFirstLoadError(true);
          }

          if( !hotels || (hotels.length == 0) ){
            self.noData(true);
            // util.scrollEnd(function() {}, true);
          } else {
            self.noData(false);
          }
          self.trip(false);
          util.redraw();
        });
      },

      loadMorePage: function() {
        var self = this;
        self.isLoadingMore(true);
        self.loadData().then(function(result) {
          self.isLoadingMore(false);
          util.hasCoor = false;
          
          if (result.code == 1) {
            var data = result.data;
            var hotels = data.datas || [];
            var total = data.total;
            if(data.status === 0){
              self.isLoadingMoreError(false);
              if ( total >= util.PS ) {
                self.isLoadingMoreNo(false);
              } else {
                self.isLoadingMoreNo(true);
              }
              var oldHotelList = self.hotelList();
              Array.prototype.push.apply(oldHotelList, hotels);
              self.hotelList(oldHotelList);
            } else {
              self.isLoadingMoreNo(true);
            }
          } else {
            // self.isLoadingMoreNo(true);
            self.isLoadingMoreError(true);
          }

          util.redraw();
        });
      },

      loadData: function(result) {
        var self = this;
        self.checkTime();
        var deferred = m.deferred();

        var dataReq = {
          startdate: util.dateFormatFmt(self.checkIn(), 'yyyyMMdd'), 
          enddate: util.dateFormatFmt(util.nextDate(self.checkIn(), self.stayDayCount()), 'yyyyMMdd'),
          st: 1,
          city: self.city(),
          ps: util.PS
        };

        // 头部过滤  附件  五星特惠 地铁直达
        if(self.filterType1()){
          // 附件  和我的位置功能一致  看字段 self.cityLoc()
        }
        if(self.filterType2()){
          dataReq.p2p = 1;
        }
        if(self.filterType3()){
          dataReq.directmetro = 1;
        }
        
        // 由近到远 传入经纬度
        // if( util.hasCurPos && util.currentPosition ){
        //   dataReq.lat = util.currentPosition.latitude;
        //   dataReq.lng = util.currentPosition.longitude;
        // }

        // 品牌
        if (self.brands().length > 0) {
          var mybrand=[], myfeature=[], mysheshi=[];
          for(var i=0,len=self.brands().length; i<len; i++){
            // 品牌 brand   品牌 设施服务 特色  统一耦合成品牌 多选
            var singleBrand = self.brands()[i];
            if(util.HOTEL_TYPE_ID[singleBrand.typeid] == 'brand'){
              // 品牌 brand
              mybrand.push(singleBrand);
            } else if(util.HOTEL_TYPE_ID[singleBrand.typeid] == 'feature'){
              // 特色 feature
              myfeature.push(singleBrand);
            } else if(util.HOTEL_TYPE_ID[singleBrand.typeid] == 'sheshi'){
              // 设施 sheshi
              mysheshi.push(singleBrand);
            }
          }

          if (mybrand.length > 0) {
            // dataReq.brand = mybrand.map(function(brand,index){
            //   return brand.name;
            // }).join(',');
            dataReq.brandid = mybrand.map(function(brand,index){
              if(brand.ids){
                return brand.ids.join(',');
              }
              return brand.id;
            }).join(',');
          }

          if (myfeature.length > 0) {
            dataReq.feature = myfeature.map(function(feature,index) {
              return feature.id;
            }).join(',');
          }

          if (mysheshi.length > 0) {
            for(var i=0,len=mysheshi.length; i<len; i++){
              dataReq[mysheshi[i].id] = 1;
            }
          }
        }

        // 商圈
        if (self.circles().length > 0) {
          // dataReq.commercial = self.circles().map(function(circle) {
          //   return circle.id;
          // }).join(',');
          var lat = self.circles()[0].lat;
          var lon = self.circles()[0].lon;
          if(lat && lon){
            dataReq.lat = lat;
            dataReq.lon = lon;
            dataReq.distance = self.circles()[0].distance || 4000;
            dataReq.place = self.circles()[0].name;
          }

          if(util.HOTEL_TYPE_ID[self.circles()[0].typeid] == 'district'){
            dataReq.district = self.circles()[0].name;
          }
        }

        // 附近  我的位置
        // if(util.hasCurPos && util.currentPosition.latitude && util.currentPosition.longitude){
        //   dataReq.lat = util.currentPosition.latitude;
        //   dataReq.lon = util.currentPosition.longitude;
        //   dataReq.distance = self.circles()[0].distance || 2000;
        // }

        // 星级
        if (self.starLevel()[0] == '不限' || self.starLevel().length==0 ) {
          
        } else {
          var stars =0;
          for(var i=0,len=self.starLevel().length; i<len; i++){
            var starLevel = self.starLevel()[i];
            stars= stars | parseInt(util.STAR_TYPES_VALUES[starLevel]);
          }

          dataReq.star = stars;
        }
        // 价格
        if (self.priceRange() == '不限') {

        } else {
          var range = util.SEARCH_PRICE_RANGES_VALUES[self.priceRange()];
          if (range.min > -1) {
            dataReq.minprice = range.min;
          }
          if (range.max > -1) {
            dataReq.maxprice = range.max;
          }
        }

        // 坐标优先级最高的  首页的我的位置 列表页面的附近
        // 附近  vm.filterType1(true);
        if(self.cityLoc() && self.cityLoc().lat){
          dataReq.lat = self.cityLoc().lat;
          dataReq.lon = self.cityLoc().lon;
          dataReq.place = '';
        } else {
          self.cityLoc(false);
        }

        // 推荐排序
        dataReq.stf = util.SORT_TYPE_VALUES[self.sortType()];
        dataReq.stt = 1;
        if(dataReq.stf == 'minprice'){
          dataReq.stf = 'price';
          dataReq.stt = 0;
        } else if(dataReq.stf == 'maxprice'){
          dataReq.stf = 'price';
          dataReq.stt = 1;
        } else if(dataReq.stf == 'dis'){
          if(dataReq.lat&&dataReq.lon){
             dataReq.stf = 'dis';
             dataReq.stt = 0;
          } else {
            dataReq.stf = 'score',
            self.sortType('推荐排序');
          }
        }
        // 关键字
        if (self.keyword()) {
          dataReq.q = self.keyword();
        }

        // 特色 feature
        // if (self.feature().length > 0) {
        //   dataReq.feature = self.feature().map(function(feature) {
        //     return feature.name;
        //   }).join(',');
        // }
        
        // 行政区域 district
        // if (self.district().length > 0) {
        //   dataReq.district = self.district().map(function(district) {
        //     return district.name;
        //   }).join(',');
        // }
        dataReq.pn = self.currentPage();
        dataReq.from = util.NCOMMON_PARAMS.from;
        dataReq.uid = util.NCOMMON_PARAMS.uid;

        // 追加城市参数
        util.extendCommon(dataReq);

        if(self.trip()){
          var trip = JSON.parse(self.trip());
          if(trip){
            if(trip.from){
              dataReq.from = 'gtxc2';
            }
            if(trip.pn){
              dataReq.pn = trip.pn;
            }
            if(trip.ps){
              dataReq.ps = trip.ps;
            }
            if(trip.st){
              dataReq.st = trip.st;
            }
          }
        }

        // alert(JSON.stringify(dataReq));

        // http://43.241.208.207:9900/st=4&city=%E5%8C%97%E4%BA%AC&q=%E5%B8%8C&ps=10
        m.request({
          url: util.INTERFACE_GETHOTELDATA,
          method: 'GET',
          data: dataReq,
          background: true
        }).then(function(result) {
          util.log(result);
          deferred.resolve({
            code: 1,
            data: result
          });
        }, function() {
          deferred.resolve({
            code: -1
          });
        });
        
        return deferred.promise;
      },

      selectDate: function() {
        var self = this;
        self.checkTime();
        m.loadRoute('selectDate').then(function(dateSelector) {
          dateSelector.viewModel.config({
            beginDate: self.checkIn().getTime(),
            dayCount: self.stayDayCount()
          }).then(function(newDate) {
            // self.sortType('-1');
            self.checkIn(newDate.beginDate);
            self.stayDayCount(newDate.dayCount);
            window.scrollTo(0, 0);
            // 供首页使用
            util.storage.setItem('fstar_hotelDateInfo', JSON.stringify({
              checkIn: newDate.beginDate,
              checkOut: util.nextDate(newDate.beginDate, newDate.dayCount),
              stayDayCount: newDate.dayCount
            }));

            self.isLoadingMoreNo(false);
            history.back();
          });
          window.scrollTo(0, 0);
          m.route('selectDate');
        });
      },

      goToSearch: function() {
        var self = this;
        self.checkTime();
        m.loadRoute('searchApp').then(function(searchApp) {
          util.showLoading();
          searchApp.config({
            keyword: self.keyword(),
            city: self.city(),
            checkIn: self.checkIn(),
            checkOut: util.nextDate(self.checkIn(), self.stayDayCount())
          }).then(function(data) {
            util.log(data);
            self.keyword(data.keyword);
            self.type(data.type);
            self.sid(data.id);
            self.sids(data.ids);
            self.lat(data.lat);
            self.lon(data.lon);
            self.typeid(data.typeid);
            util.cookie.removeItem("fstar_cityLoc");
            self.cityLoc(false);

            // 品牌 brand   品牌 设施服务 特色  统一耦合成品牌 多选
            if(util.HOTEL_TYPE_ID[self.typeid()] == 'brand'){
              self.brands([{
                name:self.keyword(),
                id: self.sid(),
                ids: self.sids(),
                typeid: self.typeid()
              }]);
            } else {
              self.brands([]);
            }
            // 特色 feature
            if(util.HOTEL_TYPE_ID[self.typeid()] == 'feature'){
              self.brands().push({
                name: self.keyword(),
                id: self.sid(),
                typeid: self.typeid()
              });
            }

            // 设施 sheshi
            if(util.HOTEL_TYPE_ID[self.typeid()] == 'sheshi'){
              self.brands().push({
                name: self.keyword(),
                id: self.sid(),
                typeid: self.typeid()
              });
            }

            // 商圈 commercial 商圈 行政区  机场车站  地铁站  统一耦合成商圈 单选
            if(util.HOTEL_TYPE_ID[self.typeid()] == 'commercial'){
              self.circles([{
                name: self.keyword(),
                id: self.sid(),
                lat: self.lat(),
                lon: self.lon(),
                typeid: self.typeid()
              }]);
            } else if(util.HOTEL_TYPE_ID[self.typeid()] == 'district'){
              // 行政区 district  耦合到商圈  单选 所以不做过多的判断
              self.circles([{
                name: self.keyword(),
                id: self.sid(),
                lat: self.lat(),
                lon: self.lon(),
                typeid: self.typeid()
              }]);
            } else {
              self.circles([]);
            }

            // 价格星级
            self.starLevel(self.starLevel());
            self.priceRange(self.priceRange());

            // 排序  -1 为推荐排序
            self.sortType('-1');
            
            // 关键字
            if(self.type() == 'q'){
              self.keyword(self.keyword());
            } else {
              self.keyword('');
            }

            window.scrollTo(0, 0);
            self.isLoadingMoreNo(false);
            // 头部过滤清空
            self.filterType1(false);
            self.filterType2(false);
            self.filterType3(false);
            history.back();
          });
          window.scrollTo(0, 0);
          m.route('searchApp');
        });
      },

      brandFilter: function(){
        var self = this;
        self.checkTime();
        util.showLoading();
        m.loadRoute('brandFilter').then(function(brandFilter) {
          brandFilter.viewModel.config({
            brands: self.brands()
          }).then(function(brands) {
            util.log(brands);
            self.brands(brands);
            self.isLoadingMoreNo(false);
            window.scrollTo(0, 0);
            history.back();
          });
          window.scrollTo(0, 0);
          m.route('brandFilter');
        });
      },

      circleFilter: function() {
        var self = this;
        self.checkTime();
        util.showLoading();
        m.loadRoute('circleFilter').then(function(circleFilter) {
          circleFilter.viewModel.config({
            circles: self.circles()
          }).then(function(circles) {
            // 同附近都是坐标  互斥   所以取消附近  
            self.cityLoc(false);
            self.filterType1(false);
            util.cookie.removeItem("fstar_cityLoc");

            util.log(circles[0]);
            self.circles(circles);
            self.isLoadingMoreNo(false);
            window.scrollTo(0, 0);
            self.sortType('距离优先');
            history.back();
          });
          window.scrollTo(0, 0);
          m.route('circleFilter');
        });
      },

      priceFilter: function() {
        var self = this;
        self.checkTime();
        util.actionSheet(util.STAR_TYPES, self.starLevel(),util.SEARCH_PRICE_RANGES, self.priceRange()).then(function(data) {
          if('cancel' == data ){
            return;
          }

          self.starLevel(data.level.concat());
          self.priceRange(data.range.concat());

          window.scrollTo(0, 0);
          self.hotelList([]);
          self.isLoadingMoreNo(false);
          self.loadFirstPage();
          
          // util.redraw();
        });
      },

      sortFilter: function(sort,idx) {
        var self = this;
        if(self.sortType() == sort){

        } else {
          self.sortType(sort);
          window.scrollTo(0, 0);
          self.hotelList([]);
          self.isLoadingMoreNo(false);
          self.loadFirstPage();
          // util.redraw();
        }
        self.isShowSort(false);
      },

      goToDetail: function(hotelId, name) {
        var self = this;
        self.checkTime();
        if (util.PLATFORM.CURRENT == util.PLATFORM.HBGJ || (util.PLATFORM.CURRENT == util.PLATFORM.GTGJ) ) {
          var flag = '';
          if (util.PLATFORM.CURRENT = util.PLATFORM.HBGJ) {
            flag='?from=hbgj'
          }
          if (util.PLATFORM.CURRENT = util.PLATFORM.GTGJ) {
            flag='?from=gtgj'
          }
          // index.html#  正式上线用这个
          var url = window.apiRootPath + '/index.html#' + ['detail', hotelId, self.checkIn().getTime(), self.stayDayCount()].join('/') +flag;
          // if(location.href.indexOf('test.html') > -1 ){
          //   url = window.apiRootPath + '/test.html#' + ['detail', hotelId, self.checkIn().getTime(), self.stayDayCount()].join('/') +flag;
          // }
          // alert(url);
          util.openWindow( url , true);
        } else {
          util.showLoading();
          m.loadRoute('detail').then(function(detailApp) {
            // .isInitialized == false 时取url的入住和离店时间
            detailApp.isInitialized = false;
            m.route(['detail', hotelId, self.checkIn().getTime(), self.stayDayCount()].join('/'));
          });
        }
      },

      cancelSearchKey: function(){
        var self = this;
        self.keyword('');
        self.type('q');
        window.scrollTo(0, 0);
        self.isLoadingMoreNo(false);
        self.loadFirstPage();
      },

      reloadTime: function(){
        var self = this;
        var hotelDateInfo = JSON.parse(util.storage.getItem('fstar_hotelDateInfo') || "{}");
        var checkIn = hotelDateInfo.checkIn;
        var checkOut = hotelDateInfo.checkOut;
        var stayDayCount = hotelDateInfo.stayDayCount;

        util.reloadByTimeLocal(checkIn);
        if(util.isReload){
          self.checkIn( new Date() );
          self.checkOut( util.nextDate(new Date(), 1));
          self.stayDayCount(1);
        } else {
          self.checkIn( (checkIn && new Date(checkIn)) || new Date() );
          self.checkOut( (checkOut && new Date(checkOut)) || util.nextDate(new Date(), 1));
          self.stayDayCount(stayDayCount || 1);
        }
      },

      filter: function(filtertype){
        var self = this;
        if(filtertype==1){
          // self.cityLoc({
          //   name: '我的位置',
          //   lat:'40.002274',
          //   lon:'116.4868895'
          // });
          // util.hasCurPos = true;

          // self.brands([]);
          // self.circles([]);
          // self.starLevel(['不限']);
          // self.priceRange('不限');
          // // self.sortType('-1');
          // self.keyword('');
          // self.isLoadingMoreNo(false);
          // self.filterType1(true);
          // self.sortType('距离优先');
          // self.loadFirstPage();
          // return;

          if(self.filterType1()){
            self.cityLoc(false);
            self.filterType1(false);
            util.cookie.removeItem("fstar_cityLoc");
            self.loadFirstPage();
          } else {
            self.getCoorByAPI().then(function(status){
              if(status == 'ok'){
                self.brands([]);
                self.circles([]);
                self.starLevel(['不限']);
                self.priceRange('不限');
                // self.sortType('-1');
                self.keyword('');
                self.isLoadingMoreNo(false);
                self.filterType1(true);
                self.sortType('距离优先');
                self.loadFirstPage();
                // util.redraw();
              }
            });
          }
        } else {
          window.scrollTo(0, 0);
          self.hotelList([]);
          self.isLoadingMoreNo(false);
          if(filtertype==2){
            self.filterType2(!self.filterType2());
            self.loadFirstPage();
          }
          if(filtertype==3){
            self.filterType3(!self.filterType3());
            self.loadFirstPage();
          }
        }
      },

      getCoorByAPI: function(){
        var self = this;
        var deferred = m.deferred();
        var currentPlatName = '浏览器';
        // 获取位置信息
        util.currentPosition = null;
        if(util.PLATFORM.CURRENT == util.PLATFORM.HBGJ || util.PLATFORM.CURRENT == util.PLATFORM.GTGJ){
          currentPlatName = '高铁管家';
          if(util.PLATFORM.CURRENT == util.PLATFORM.HBGJ){
            currentPlatName = '航班管家';
          }
          _nativeAPI.invoke('getCurrentPosition', null, function(err, result) {
            if (!result.errDesc) {
              try {
                util.currentPosition = result;
                var lat = util.currentPosition.latitude;
                var lng = util.currentPosition.longitude;

                if((""+lat).indexOf('E-')>-1){
                  util.currentPosition = null;
                  util.alert({
                    title: '获取位置失败',
                    content: '未获取到位置，请重新点击获取'
                  });
                  return;
                }
                if(lat && (lat > 90) ){
                  util.currentPosition.latitude = lng;
                  util.currentPosition.longitude = lat;
                }
                self.getAddressByCoor(currentPlatName, deferred);
              } catch(e) {
                util.currentPosition = null;

                util.alert({
                  title: '获取位置失败',
                  content: '请在系统设置中打开“定位服务”，并允许“'+currentPlatName+'”获取您的位置'
                });
                deferred.resolve();
              }
            } else{
              util.currentPosition = null;
              util.alert({
                title: '获取位置失败',
                content: '请在系统设置中打开“定位服务”，并允许“'+currentPlatName+'”获取您的位置'
              });
              deferred.resolve();
            }
          });
        } else {
          util.currentPosition = null;
          util.alert({
            title:'获取位置失败',
            content:'请在系统设置中打开“定位服务”，并允许“'+currentPlatName+'”获取您的位置'
          });
          deferred.resolve();
        }
        return deferred.promise;
      },

      getAddressByCoor: function(currentPlatName, deferred){
        var self = this;
        if(!util.currentPosition){
          util.alert({
            title:'获取位置失败',
            content:'请在系统设置中打开“定位服务”，并允许“'+currentPlatName+'”获取您的位置'
          });
          deferred.resolve();
          return;
        }
        util.showLoading();
        var dataReq = {
          st:9,
          lat:util.currentPosition.latitude,
          lon:util.currentPosition.longitude,
          from: util.NCOMMON_PARAMS.from,
          uid: util.NCOMMON_PARAMS.uid
        };

        // alert(JSON.stringify(dataReq));
        // alert(util.INTERFACE_GETHOTELMENUDATA);
        m.request({
          method: 'GET',
          url: util.INTERFACE_GETHOTELMENUDATA,
          data: dataReq
        }).then(function(data) {
          if (data.id && data.name) {
            var curcity = util.NCOMMON_PARAMS.city;
            var curcityid = util.NCOMMON_PARAMS.cityid;
            var switchcity = function(){
              // 这里需要城市的名称和cityid
              self.cityLoc({
                name: util.currentPosition.address || '我的位置',
                lat:util.currentPosition.latitude,
                lon:util.currentPosition.longitude
              });
              util.hasCurPos = true;
              self.city(data.name);
              self.cityid(data.id);
              
              util.cookie.setItem("lastCity", JSON.stringify({
                name: self.city(),
                cityid: self.cityid()
              }));
              util.COMMON_PARAMS.comm_cityName = self.city();
              util.NCOMMON_PARAMS.city = self.city();
              util.NCOMMON_PARAMS.cityid = self.cityid();
              util.cookie.setItem("fstar_cityLoc", JSON.stringify(self.cityLoc()));
              deferred.resolve('ok');
            }
            if(data.id == curcityid && data.name == curcity){
              switchcity();
            } else {
              util.hideLoading();
              util.confirm({
                title: '是否切换到'+data.name,
                content: '定位显示你在'+data.name,
                ok: '切换城市',
                cancel: '取消'
              }).then(function(msg) {
                if (msg === 'ok') {
                  switchcity();
                } else {
                  deferred.resolve();
                }
              });
            }
          } else {
            util.hideLoading();
            util.currentPosition = null;
            util.alert({
              title: '获取位置失败',
              content: '未获取到位置，请重新点击获取'
            });
            deferred.resolve();
            return;
          }
        }, function() {
          util.alert({
            content: '网络不给力，请稍后再试试吧',
            ok: '知道了'
          });
          util.hideLoading();
          deferred.resolve();
          return;
        });

      },

      filterReset: function(){
        var self = this;
        self.sortType('-1');
        self.brands([]);
        self.circles([]);
        self.starLevel(['不限']);
        self.priceRange('不限');
        self.keyword('');
        // self.feature([]);
        // self.district([]);
        window.scrollTo(0, 0);
        self.isLoadingMoreNo(false);

        self.cityLoc(false);
        self.filterType1(false);
        util.cookie.removeItem("fstar_cityLoc");
      },

      onunload: function() {
        var self = this;
        util.lazyLoad(false);
        util.scrollEnd(null, false);
        self.hotelList([]);
        self.trip(false);
        document.getElementById('actionSheet').className = 'common-as';
      }
    },

    init: function() {
      var self = this;
      self.isInitialized = true;
      var vm = listApp.viewModel;
      var checkIn = new Date(parseInt(m.route.param('checkIn'), 10));
      var checkOut = new Date(parseInt(m.route.param('checkOut'), 10));
      if(m.route.param('keyword')){
        vm.keyword( m.route.param('keyword'));
      }
      
      // 判断时间是否已经过今日
      util.reloadByTimeLocal(checkIn);
      if(util.isReload){
        checkIn = new Date();
        checkOut = util.nextDate(new Date(), 1);
      }
      vm.checkIn( checkIn );
      vm.stayDayCount(util.dateCount(checkIn, checkOut));
      vm.city(util.NCOMMON_PARAMS.city);
      if (m.route.param('reset')) {
        vm.filterReset();
      }
      if( vm.cityLoc() && vm.cityLoc().lat ){
        vm.filterType1(true);
      }

      var trip = m.route.param('trip');
      if (trip) {
        vm.trip(trip);
        //改变顶部右侧按钮 
        util.rightButtonText();
      }
    }
  };

  listApp.controller = function() {
    var vm = listApp.viewModel;

    // 同步日期
    vm.reloadTime();
    // 只需初始化一次即可
    if (!listApp.isInitialized ) {
      listApp.init();
    }

    vm.loadFirstPage();
    util.updateTitle('伙力特惠五星');

    util._getDeviceInfo().then(function() {
      if (util.DEVICE_INFO && (util.DEVICE_INFO.version == '3.1' || (util.DEVICE_INFO.version == '3.2' && util.OS == 'iOS'))) {
        util.alert({
          title: '请升级高铁管家',
          content: '现在版本不能预订酒店'
        });
      } else {
        util.userCenter._checkLogin().then(function(isLogin) {
        });
      }
    });

    util.lazyLoad(true);

    util.scrollEnd(function() {
      if (vm.isFirstLoading()) {
        return;
      }

      if (vm.isLoadingMore()) {
        return;
      }
      if (vm.isLoadingMoreNo()) {
        return;
      }
      vm.currentPage(vm.currentPage() + 1);
      vm.loadMorePage();
    }, true);

    return listApp.viewModel;
  };

  listApp.view = function(ctrl) {
    return [
      listApp.searchTriggerView(ctrl),
      m('.listApp-placeholder'),
      listApp.listView(ctrl),
      listApp.loadMoreView(ctrl),
      listApp.bottomTabView(ctrl),
      listApp.sortTypeView(ctrl)
    ];
  };

  listApp.searchTriggerView = function(ctrl) {
    return m('.listApp-search', [
      m('.listApp-bar', [
        m('.listApp-date', {honclick: ctrl.selectDate.bind(ctrl)}, [
          m('div', [
            m('span.numFont',util.dateFormatFmt(ctrl.checkIn(), 'MM月dd日'))
          ]),
          m('div', [
            m('span.numFont',util.dateFormatFmt(util.nextDate(ctrl.checkIn(), ctrl.stayDayCount()), 'MM月dd日'))
          ]),
          m('.common-icon-date-arrow')
        ]),
        m('.listApp-search-box',[
          m('.listApp-input', {
            honclick: ctrl.goToSearch.bind(ctrl)
          },[
            m('.common-icon-search-little'),
            m('.common-icon-search-txt',[
              ctrl.keyword()?
                m('.common-color-default',ctrl.keyword()):
                '关键词/位置/品牌/酒店名'
            ])
          ]),
          ctrl.keyword()? 
            m('.searchApp-icon-cancel',{
              onclick: ctrl.cancelSearchKey.bind(ctrl)
            },[
              m('.common-icon-input-cancel')
            ]):'',
        ])
      ]),
      listApp.hotWordView(ctrl)
    ]);
  };

  listApp.hotWordView = function(ctrl) {
    return m('.listApp-hotWordBox', [
      m('.listApp-hotWord',{
        honclick: ctrl.filter.bind(ctrl, 1),
        className: ctrl.filterType1()?'selected':''
      },'附近'),
      m('.listApp-hotWord',{
        honclick: ctrl.filter.bind(ctrl, 2),
        className: ctrl.filterType2()?'selected':''
      }, '高星特惠'),
      m('.listApp-hotWord',{
        honclick: ctrl.filter.bind(ctrl, 3),
        className: ctrl.filterType3()?'selected':''
      },'地铁直达'),
    ]);
  };

  listApp.listView = function(ctrl) {
    if (ctrl.isFirstLoading()) {
      return null;
    }
    if (ctrl.isFirstLoadError()) {
      return listApp.noHotelView(ctrl);
    }
    if (ctrl.hotelList().length == 0) {
      document.body.style.overflow = 'hidden';
      return listApp.noHotelView(ctrl);
    }
    document.body.style.overflow = 'auto';
    return m('ul.listApp-list', ctrl.hotelList().map(function(hotel, index) {
      var extend = hotel.extend;
      var hotelname = hotel.hotelname;
      var userscore = (extend.userscore-0).toFixed(1);
      var commentcount = extend.commentnum;
      var pricesrc = util.PRICESRC[hotel.price.src] || '其他';
      var parking = '';
      var wifi = '';
      var nearbyArr = false;
      var distance = extend.commercial;

      var officialstar = extend.officialstar || '0';
      // console.log(officialstar);
      var star = util.HOTEL_STAR_OFFICIALSTAR[officialstar];
      if( officialstar == '0' || officialstar > 5){
        star = util.HOTEL_STAR_SIMPLE[hotel.star];
      }

      var sheshi = extend.sheshi;
      for(var si=0,sl=sheshi.length; si<sl; si++){
        var ss = sheshi[si];
        if( ss == "wifi"){
          wifi = 'listApp-hotel-wifi';
        } else if(ss == "parking"){
          parking = 'listApp-hotel-parking';
        }
      }
      if(extend.nearby){
        nearbyArr = extend.nearby.split(":");
        if(nearbyArr[1]){
          var neardis = nearbyArr[1];
          // <100   100-1000  每50米一个单位四舍五入    >1000 每0.1公里四舍五入
          if(neardis<=100){
            neardis = Math.round(neardis)+'米'
          } else if( neardis < 975){
            neardis = Math.round(neardis/50)*50 +'米'
          } else if( neardis <= 1000){
            neardis = '1公里';
          } else {
            neardis = Math.round(neardis/100)/10 +'公里'
          }
          
          if(nearbyArr[0].length==1){
            distance = neardis + '距' + nearbyArr[0];
          } else {
            distance = neardis + '距' + nearbyArr[0]+'站';
          }
        }
      }

      var waydistance = '',tosubwayArr=false;
      // if(util.HOTEL_NEARBYTYPE[extend.nearbytype]){
      //   nearSubway = util.HOTEL_NEARBYTYPE[extend.nearbytype];
      //   // + '-步行10分钟'
      // }
      if(extend.tosubway){
        tosubwayArr = extend.tosubway.split(":");
        if(tosubwayArr[1]){
          var neardis1 = tosubwayArr[1];
          // <100   100-1000  每50米一个单位四舍五入    >1000 每0.1公里四舍五入
          if(neardis1<=100){
            neardis1 = Math.round(neardis1)+'米'
          } else if( neardis1 < 975){
            neardis1 = Math.round(neardis1/50)*50 +'米'
          } else if( neardis1 <= 1000){
            neardis1 = '1公里';
          } else {
            neardis1 = Math.round(neardis1/100)/10 +'公里'
          }
          
          waydistance = neardis1 + '距' + tosubwayArr[0]+'站';
        }
      }

      // var taglist = ['国庆特惠','管家特惠'];
      var taglist = [];
      // if(extend.tags){
      //   taglist = extend.tags;
      // }
      try{ 
        taglist = extend.tags.slice() || [];
      }catch(e){
        taglist = [];
      }
      taglist.splice(2);
      // var subway=false;

      // if(taglist.indexOf('邻近地铁') != '-1'){
      //   subway=true;
      // }

      var imgTag = '';
      // true提前一天预定 缺少
      // var prebook;
      // try{ 
      //   prebook = hotel.roomInfos[0].productInfos[0].preBook;
      // }catch(e){
      // }
      // false 售完
      if( hotel.soldout == 1 ){
        imgTag = 'soldout';
      }
      var imageUrl;
      try{
        imageUrl = extend.logourl || null;
      }catch(e){
        imageUrl = null;
      }
      var price;
      try{
        price = Math.ceil(hotel.price.price);
      }catch(e){
        price = 0;
      }
      if(extend.youhui == '返现'){
        taglist.push('返现');
      }

      return m('li', {
        onclick: ctrl.goToDetail.bind(ctrl, hotel.hotecode, hotelname),
        className: imgTag
      }, [
        m('.listApp-hotel', [
          m('.listApp-hotel-img', [
            index > 9 || (/null/.test(imageUrl) )?
            m('img.lazy-load', {
              'data-src': imageUrl
            })
            :
            m('img', {
              'data-src': imageUrl,
              'src': imageUrl
            })
          ]),

          m('.listApp-hotel-txt', [
            m('.listApp-hotel-name', hotelname),
            m('.listApp-hotel-info', {
                className: waydistance? 'listApp-small-lh':''
              }, [
              m('.listApp-hotel-info-left',[
                m('.listApp-hotel-pos', [
                  m('span.listApp-hotel-blue',userscore+'分'),
                  '/'+commentcount+'条评论'
                ]),
                m('.listApp-hotel-pos',{
                  className: wifi + ' ' +parking
                },[
                  m('span.listApp-hotel-star',star),
                  m('span.common-icon-wifi'),
                  m('span.common-icon-parking')
                ])
              ]),
              m('.listApp-hotel-info-right', [
                m('.listApp-hotel-member', [
                  m('span.listApp-hotel-pricesrc', '['+pricesrc+']'),
                  m('span.listApp-hotel-subprice', '￥'),
                  m('span.listApp-hotel-price.numFont', price),
                  m('i', '起')
                ]),
                m('.listApp-hotel-tags', taglist.map(function(tag,idx) {
                  if(!tag){ return ''};
                  if(tag == '返现'){
                    return m('em.common_icon_package');
                  }
                  return m('span', tag);
                }))
              ])
            ]),
            waydistance? m('.listApp-small-lh',[
              m('.list-hotel-distance', distance),
              m('.list-hotel-distance', [
                m('.common-icon-tag',{
                  className: 'common-icon-tag'
                }),
                waydistance
              ])
            ]):m('.list-hotel-distance', distance),

            // m('.list-hotel-distance', [
            //   m('.common-icon-tag',{
            //     className: 'common-icon-tag'+extend.nearbytype
            //   }),
            //   distance
            // ])
          ])
        ])
      ]);

    }));
  };

  listApp.noHotelView = function(ctrl) {
    var resultDesc;
    if (ctrl.resultCode() == 503) {
      resultDesc = '当前城市暂未开通，请选择其他城市';
    } else if(ctrl.keyword()) {
      resultDesc = '没有找到与『' + ctrl.keyword() + '』' + '相关的酒店';
    } else {
      resultDesc = '没有找到相关的酒店';
    }
    return [
      m('.listApp-noHotel', [
        m('img', {
          src: __uri('../images/nohotel.png'),
          width: 60,
          height: 59
        }),
        m('br'),
        resultDesc
      ]),
      // m('.listApp-noHotel-bottomBg')
    ];
  };

  listApp.loadMoreView = function(ctrl) {
    if (ctrl.isFirstLoading() || ctrl.noData() ) {
      return null;
    }
    if (ctrl.isLoadingMoreNo()) {
      return m('.listApp-more', [
        '没有更多酒店了'
      ]);
    } else if (ctrl.isLoadingMoreError()){
      return m('.listApp-more', [
        'error'
      ]);
    } else {
      return m('.listApp-more', [
        m('img', {className: 'loading', src: __uri('../images/loading.gif')}),
        '加载中...'
      ]);
    }
  };

  listApp.bottomTabView = function(ctrl) {
    var defaultbrand = ctrl.brands().length === 0;
    var defaultcircles = ctrl.circles().length === 0;
    var defaultprice = ctrl.priceRange() == '不限';
    var defaultstar = defaultprice?0:1;
    if ( ctrl.starLevel().length==0 || ctrl.starLevel()[0] == '不限' ) {

    } else {
      defaultstar += ctrl.starLevel().length;
    }
    var defaultsort = (ctrl.sortType() == '-1' || ctrl.sortType() == '推荐排序');

    return m('.listApp-bottom-tab', [
      m('.common-border'),
      m('.listApp-tab', {
        honclick: ctrl.brandFilter.bind(ctrl)
      }, [
        m('.listApp-tab-icon.common-icon-filter1',{
          // className: defaultbrand?'':'common-icon-filter1s'
        }),
        defaultbrand ?'':
        m('.listApp-tab-num.numFont',ctrl.brands().length),
        m('.listApp-tab-text', [
          defaultbrand ? '筛选' : 
          m('.colorBlue1',ctrl.brands().map(function(brand) {
            return brand.name;
          }).join('/'))
          // m('.colorBlue',ctrl.brands().join(''))
        ])
      ]),

      m('.listApp-tab', {
        honclick: ctrl.circleFilter.bind(ctrl)
      }, [
        m('.listApp-tab-icon.common-icon-filter2',{
          // className: defaultcircles?'':'common-icon-filter2s'
        }),
        defaultcircles ?'':
        m('.listApp-tab-num1'),
        m('.listApp-tab-text', [
          defaultcircles ? '位置' : 
          m('.colorBlue1',ctrl.circles().map(function(circle) {
            return circle.name;
          }).join('/'))
        ])
      ]),

      m('.listApp-tab', {
        honclick: ctrl.priceFilter.bind(ctrl)
      }, [
        m('.listApp-tab-icon.common-icon-filter3',{
          // className: defaultprice?'':'common-icon-filter3s'
        }),
        defaultstar?
        m('.listApp-tab-num.numFont',defaultstar):'',
        m('.listApp-tab-text', [
          '价格/星级'
          // defaultprice ? '价格/星级' : 
          // m('.colorBlue1',ctrl.priceRange())
        ])
      ]),

      m('.listApp-tab', {
        onclick: ctrl.showSort.bind(ctrl)
      }, [
        m('.listApp-tab-icon.common-icon-filter4',{
          // className: defaultsort?'':'common-icon-filter4s'
        }),
        m('.listApp-tab-text', [
          defaultsort ? '推荐排序':
          m('.colorBlue1',ctrl.sortType())
        ])
      ])
    ]);
  };

  listApp.sortTypeView = function(ctrl) {
    if(ctrl.sortType() == '-1'){
      ctrl.sortType('推荐排序');
    }
    return m('.listApp-sort',{
      className: ctrl.isShowSort()?'show':''
    },[
      m('.listApp-sort-bg',{
        onclick: ctrl.hideSort.bind(ctrl)
      }),
      m('.listApp-sort-main',[
        m('.listApp-sort-items',[
          util.SORT_TYPES.map(function(value, index){
            // var className = '';
            // if(value == '距离优先'){
            //   return m('.listApp-sort-item',{
            //     className: 'noselected'
            //   }, value);
            // };
            return m('.listApp-sort-item',{
              className: ctrl.sortType() == value? 'selected':'',
              onclick: ctrl.sortFilter.bind(ctrl, value, index)
            }, value);
          })
        ])
      ])
    ]);
  };
  return listApp;

})();