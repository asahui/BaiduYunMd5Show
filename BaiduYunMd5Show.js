// ==UserScript==
// @name        BaiduYunMd5Show
// @namespace   asahui
// @description Show the md5 of files in the baidu pan
// @include     http://pan.baidu.com/disk/home*
// @version     0.1
// @grant       none
// ==/UserScript==

(function() {
	// $ is global variant in pan.baidu.com
	// var $ = require("common:widget/libs/jquerypacket.js");
	var api = require("common:widget/api-center/api-center.js");
	var hashApi = require("common:widget/hash/hash.js");

	var selector = {
	        mod: "div.module-list-view",
	        modCrumbs: "div.module-crumbs",
	        nameText: 'span[node-type~="name-text"]',
	        titleSize: 'div[data-key~="size"]',
	        titleTime: 'div[data-key~="time"]',
	        titleMd5:'div[data-key~="md5"]',
	        titleCol: 'div[node-type~="title-col"]',
	        orderStatus: 'span[node-type~="order-status"]',
	        loadNum: 'span[node-type~="load-num"]',
			crumbItem: 'a[node-type~="crumbs-item"]',
			list: 'div[node-type~="list"]'
   	};
	var requestParam = {
		num: 100,
        page: 1,
        dir: "/",
        order: "time",
        desc: 1,
        showempty: 0
	};

	var isSort = false;

	requestParam.dir = hashApi.get("path") ? hashApi.get("path") : "/" ;
	var lastPath  = "";
	console.log(requestParam.dir);

	// change the global render crumbs callback function and add customEvent
	mdev.message.listen("render-crumbs-count", function(num, m) {
        var text = "";
        var crumb = $(selector.modCrumbs);
        text = m ? "已全部加载，共" + num + "个" : "已加载" + num + "个", -1 === num && (text = "获取更多数据..."), crumb.find(selector.loadNum).html(text).trigger('loadnumChanged');
    });

    

/*
-------------------------------用户界面GUI View-------------------------------------
*/
	function showMd5(data) {
		var md5Title = '<div node-type="title-col" data-key="md5" class="col" style="width: 16%; border-right: none;">\
                			MD5\
                			<span node-type="order-status" class="asc desc" style="visibility: visible;"></span>\
            			</div>';
		if($(selector.titleMd5).length == 0) {
			$(selector.titleSize).css("width", "10%");
			$(selector.titleTime).css("width", "13%").css("border-right", "").after(md5Title);
		}		


		data.forEach(function(item) {
			var cols = $('div[data-id='+item.fs_id+']').children();
			$(cols.get(1)).css("width", "10%");
			$(cols.get(2)).css("width", "13%")
			var md5col = item.md5.length > 0 ?
				'<div class="col" style="width: 16%">'+ item.md5 + '</div>' :
				'<div class="col" style="width: 16%"> - </div>';
			$(cols.get(2)).after(md5col);
		});
	}



/**
-------------------------------函数 Model-------------------------------------
*/
	function getFileList(param) {
		api.getFileListAsyc(param, function(data) {
			
			var listData = [];
			
			for (var i = 0; i < data.list.length; i++) {
				var col = {};
				col.fs_id = data.list[i].fs_id;
				col.md5 = data.list[i].md5 ? data.list[i].md5 : "";
				listData.push(col);
			}
			showMd5(listData);
		});
	}

	function delegateEvent() {
		
   		
   		var moduleListView = $(selector.mod);
   		moduleListView.delegate(selector.nameText, "click", function() {
   			requestParam.dir = hashApi.get("path");
   			lastPath !== requestParam.dir ? requestParam.page = 1 : lastPath;
   			//console.log(requestParam.dir);
   		});

   		moduleListView.delegate(selector.titleCol, "click", function(e) {
   			//console.log(e.target);
   			//console.log($(e.target).closest(selector.titleCol));
   			//console.log($(e.target).closest(selector.titleCol).find(selector.orderStatus));
   			requestParam.page = 1;
   			isSort = true;
   			requestParam.order = $(e.target).closest(selector.titleCol).data("key");
   			var isDesc = $(e.target).closest(selector.titleCol).find(selector.orderStatus).hasClass("desc") ? !0 : !1;
   			isDesc ? requestParam.desc = 1 : delete requestParam.desc;

   		});

   		var moduleCrumbs = $(selector.modCrumbs);
   		moduleCrumbs.delegate(selector.crumbItem, "click", function() {
   			requestParam.dir = hashApi.get("path");
			lastPath !== requestParam.dir ? requestParam.page = 1 : lastPath;
   			//console.log(requestParam.dir);
   		});

   		var e, scrollHeight;
   		var scrollList = moduleListView.find(selector.list);
   		scrollList.bind("scroll", function() {
   			var t = this;
            window.clearTimeout(e), e = window.setTimeout(function() {
                var top = scrollList.scrollTop(),
                    height = scrollList.height();
                // sometime you scroll down in one page and click a directory to go inside
                // the list will be cleared, so the scroll data will change and trigger this scroll event
                // then it will try to fetch page 2
              	// add a condition(lastPath === requestParam) to avoid this.
                scrollHeight = t.scrollHeight, height + top > scrollHeight - 200 && lastPath === requestParam.dir && requestParam.page++;
            }, 100);
 
   		});
		


		// if file list render, crumb will be changed. Do my job when crumb-count-render finished
   		$(selector.loadNum).bind('loadnumChanged', function(e) {
   			console.log("loadnumChange:"+requestParam.dir);
   			console.log(lastPath !== requestParam.dir);
   			console.log($(this).html());
   			// avoid sroll event fetching page 2 which is empty
   			if ((lastPath !== requestParam.dir ||  requestParam.page > 1 || isSort)
   				        && $(this).html().indexOf('已') > -1) {
   				getFileList(requestParam);
   				lastPath = requestParam.dir;
   				isSort = false;
   			}
   		});
	}

/**
-------------------------------控制 Control-------------------------------------
*/

	delegateEvent();
	$(selector.loadNum).trigger("loadnumChanged");

})();