importScripts('jquery.hive.pollen.js');

var Fila = [''];
var Visitados = [];

var AddToLine = function(address) {
    
}

var Comunicate = function(address) {
    $.ajax.get({
        url: address,
        beforeSend: function (xhr) {
            xhr.setRequestHeader(
                'X-Requested-With',
                {
                    toString: function () { return ''; }
                }
            );
            ajaxTime = new Date().getTime();
            $.send({ 'event': 'onBeforeSend', 'data': [href, ajaxTime] });
        },
        success: function (jsonObj) {
            var responseTime = new Date().getTime() - ajaxTime;
            $.send({ 'event': 'success', 'object': jsonObj, 'additionalData': [address, responseTime] });
        },
        error: function (error) {
            var responseTime = new Date().getTime() - ajaxTime;
            $.send({ 'event': 'error', 'object': error, 'additionalData': [address, responseTime] });
        }
    });
}

$(function (data) {
    
});