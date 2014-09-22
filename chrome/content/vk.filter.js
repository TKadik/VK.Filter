Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");

var vkFeedFilter = function () {
    var readFeeds = [];

    function getReadFeedsFile() {
        return FileUtils.getFile("Home", ["vkReadFeeds.json"]);
    }

    function isChecking(){
        return document.getElementById('vk-feed-filter-toolbar-button').checked;
    }

    var processFeed = function (feed) {
        var $feed = $(feed),
            feedInstance = {
                postText: $feed.find('.wall_post_text').text(),
                postImage: $feed.find('.page_post_sized_thumbs img').map(function () {
                    return this.src;
                }).get().join(", "),
                postAudio: $feed.find('.post_media .title_wrap').map(function () {
                    return '"' + $(this).text() + '"';
                }).get().join(', ')
            },
            feedHash = hashCode(feedInstance.postText + feedInstance.postImage + feedInstance.postAudio);

        if(feedHash) {
            if (readFeeds.indexOf(feedHash) > -1) {
                $feed.hide();
            } else {
                readFeeds.push(feedHash);
            }
        }

        $feed.addClass('was-read');
    };

    var hashCode = function (str) {
        var hash = 0, i, chr, len;
        if (str.length == 0) return hash;
        for (i = 0, len = str.length; i < len; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };

    function checkForChanges() {
        var newFeeds = content.document.querySelectorAll('.feed_row:not(.was-read)');

        for (var i = 0; i < newFeeds.length; i++) {
            processFeed(newFeeds[i]);
        }

        if (isChecking()) {
            setTimeout(checkForChanges, 100); // Check the DOM again within a 100ms.
        }
    }

    function readData(callBack) {
        var file = getReadFeedsFile();

        NetUtil.asyncFetch(file, function (inputStream, status) {
            if (!Components.isSuccessCode(status)) {
                // Handle error!
                alert(status);
                return;
            }

            // The file data is contained within inputStream.
            // You can read it into a string with
            try {
                readFeeds = JSON.parse(NetUtil.readInputStreamToString(inputStream, inputStream.available(), { charset: "UTF-8"}));
            }
            catch (ex) {
                readFeeds = [];
            }

            console.log(readFeeds);
            callBack();
        });
    }

    function saveData() {
        try {
            var file = getReadFeedsFile();
            var oStream = FileUtils.openSafeFileOutputStream(file);

            var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
            converter.charset = "UTF-8";
            var iStream = converter.convertToInputStream(JSON.stringify(readFeeds));

            NetUtil.asyncCopy(iStream, oStream, function (status) {
                if (!Components.isSuccessCode(status)) {
                    // Handle error!

                    console.log(status);
                    alert(status);

                    return;
                }
            });
        }
        catch (ex){
            alert('VK filter error: \n' + ex);
        }
    }

    return {
        run: function () {
            try {
                if (isChecking()) {
                    readData(checkForChanges);
                } else {
                    saveData();
                }
            }
            catch (ex) {
                alert(ex);
            }
        }
    };
}();
console.log('init');