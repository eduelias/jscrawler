importScripts('jquery.hive.pollen.js');

var Fila = [];
var Visitados = [];

/*
 * Add a shuffle function to Array object prototype
 * Usage : 
 *  var tmpArray = ["a", "b", "c", "d", "e"];
 *  tmpArray.shuffle();
 */
Array.prototype.shuffle = function () {
    var i = this.length, j, temp;
    if (i == 0) return this;
    while (--i) {
        j = Math.floor(Math.random() * (i + 1));
        temp = this[i];
        this[i] = this[j];
        this[j] = temp;
    }
    return this;
};

var AlreadyVisited = function (endereco) {
    var filtered = Visitados.filter(function(n) {
        return n.endereco === endereco;
    });
    
    return filtered.length > 0;
}

var AddToLine = function(obj, params) {
    
    if (typeof (obj.endereco) === 'undefined') {
        console.log(obj);
        return;
    }

    if (typeof (params) === 'undefined')
        params = {
            isToForceInsert: false,
            callback: 'AddedToLine'
        };
    
    if (typeof (params.isToForceInsert) === 'undefined')
        params.isToForceInsert = false;    

    if (typeof (params.callback) === 'undefined')
        params.callback = 'AddedToLine';

    var WasVisited = AlreadyVisited(obj.endereco);
    
    var historico = Visitados.filter(function (n) {
        return n.endereco === obj.endereco;
    });
    
    if (!WasVisited) {
        Fila.push(obj.endereco);
        var visitado = {
            'endereco': obj.endereco, 'origem': obj.origem, 'breadcrum': obj.breadcrum /*, 'tempo': obj.tempo*/
        };
        Visitados.push(visitado);        
    } else if (params.isToForceInsert)
        Fila.push(obj.endereco);

    if (params.isToForceInsert || !WasVisited) 
        $.send({ 'event': params.callback, 'parametros': { 'endereco' : obj.endereco, 'breadcrum' : historico.breadcrum } });
}

var GetParetmFromThisGuyPlease = function (endereco, params) {

    if (typeof (params) === 'undefined')
        params = { 'callback': 'ParentFound' };

    if (typeof (params.callback) === 'undefined')
        params.callback = 'ParentFound';

    var k = Visitados.filter(function(n) {
        return n.endereco === endereco;
    });

    $.send({ 'event': params.callback, 'params' : { 'endereco': endereco, 'origem': k[0].origem, 'breadcrum':k[0].breadcrum, 'erro': params.erro } });
}

var GetOneFromLine = function (params) {

    if (typeof (params) === 'undefined')
        params = { 'callback': 'ReturningOneFromLine' };

    if (typeof (params.callback) === 'undefined')
        params.callback = 'ReturningOneFromLine';

    var novoEndereco = Fila.shift();

    var historico = Visitados.filter(function (n) {
        return n.endereco === novoEndereco;
    });

    Fila = Fila.filter(function(f) {
        return f !== novoEndereco;
    });

    var bcum = 'Breadcrum missing';
    if (typeof (historico) !== "undefined" && typeof (historico[0]) !== "undefined")
        bcum = historico[0].breadcrum;

    $.send({ 'event': params.callback, 'params': { 'objeto': novoEndereco, 'breadcrum': bcum } });

    Fila.shuffle().shuffle().shuffle();
}

var WheresTheFuckinLineData = function (params) {

    if (typeof (params) === 'undefined')
        params = { 'callback': 'TakeThatWholeLineYouLilBastard' };

    if (typeof (params.callback) === 'undefined')
        params.callback = 'TakeThatWholeLineYouLilBastard';

    $.send({ 'event': params.callback, 'params': { 'Fila': Fila } });
}

$(function (data) {
    switch (data.cmd) {
        case 'AddToLine':
            {
                AddToLine(data.objeto, data.params);
            }
            break;
        case 'GetOneFromLine':
            {
                GetOneFromLine(data.params);
            } break;
        case 'GetMyParentPlease':
            {
                GetParetmFromThisGuyPlease(data.endereco, data.params);
            }
            break;
        case 'GiveMeThatLine':
            {
                WheresTheFuckinLineData(data.params);
            }
            break;
        case 'TryToExecuteThis':
            {

                try {
                    eval('var func = ' + data.function);
                    var o = func(data.params);                    
                    $.send({ 'event': data.callback, 'objeto': o });
                } catch (e) {
                    $.send({ 'event': 'LogThatShit', 'objeto': e });
                } 
        }break;
        default:
        {
            console.log(data);
        }
    }
});