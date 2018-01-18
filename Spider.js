FAULTRANSLATIONS = [];

var LoadInfo = function (obj) {
    var endereco = $($(obj)[0]).attr('href');
    if (typeof (endereco) === 'undefined')
        return false;

    if (endereco.indexOf('returnUrl') > 0)
        return removeParam('returnUrl', endereco);

    return endereco;
}

var IsThisJson = function(str) {
    try {
        var k = JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

var Erros = [];
var PesquisandoAgora = null;

var DeveSerEnfileradoPraTeste = function (objeto) {    
    var info = LoadInfo(objeto);    
    var jqob = $(objeto);    
    var l = (info !== false &&
        typeof (info) !== 'undefined' &&
        (typeof (jqob.attr('id')) === 'undefined' || jqob.attr('id').indexOf('delete') < 0) &&
        info !== '#' &&        
        jqob.text() !== 'Sair' &&
        jqob.attr("href").indexOf("logout") < 0 &&
        jqob.css('visibility') !== 'hidden' &&
        jqob.css('display') !== 'none' &&
        info.indexOf('xport') < 0 &&
        info.indexOf('elatorio') < 0 &&
        info.indexOf('report') < 0 &&
        info.indexOf('avascript') < 0 &&
        info.indexOf('pdf') < 0 &&
        info.indexOf('http') < 0 &&        
        ($("#excludes").val() == '' || (new RegExp($("#excludes").val().replace(/\//g, "\/"), "gi").test(info))) &&
        //($("#excludes").val() == '' || (new RegExp($("#excludes").val().replace(/\//g, "\/").replace(/\*/g, "(.*?)").replace(/;/g, "|"), "gi").test(info))) &&
        info.indexOf('TabelasSistema') < 0 &&
        info.indexOf('GetFile') < 0);       
    return l;
}

// check if an element exists in array using a comparer function
// comparer : function(currentElement)
Array.prototype.onArray = function (comparer) {
    for (var i = 0; i < this.length; i++) {
        if (comparer(this[i])) return true;
    }
    return false;
};

// adds an element to the array if it does not already exist using a comparer 
// function
Array.prototype.pushIfNotExist = function (element, comparer) {
    if (!this.onArray(comparer)) {
        this.push(element);
    }
};

// parser 
function StringToTranslationObject(_text) {
    var index = [];
    var replacePattern = /╠╠(●|○)╣[\s]([^╣]*?)[\s]╠([^╠]*?)╣╠((?:.|\n)*?)╣╠((?:.|\n)*?)╣╣/ig;
    var nTimes = (_text.match(replacePattern) || []).length;
    var currText = _text;

    for (var i = 1; i <= nTimes; i++) {
        currText = currText.replace(replacePattern, function ($0, $1, $2, $3, $4, $5) {

            var element = {
                translationKey: $2,
                defaultValue: $4,
                currentValue: $3,
                newTranslation: $1
            };

            if ($5 != "@@@")
                element.typeIdentity = $5;

            index.pushIfNotExist(element, function (item) {
                return item.translationKey === element.translationKey;
            });

            return $3;
        });
    }

    return index;
}

var removeParam = function (key, sourceURL) {
    var rtn = sourceURL.split("?")[0],
        param,
        params_arr = [],
        queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
    if (queryString !== "") {
        params_arr = queryString.split("&");
        for (var i = params_arr.length - 1; i >= 0; i -= 1) {
            param = params_arr[i].split("=")[0];
            if (param === key) {
                params_arr.splice(i, 1);
            }
        }
        rtn = rtn + "?" + params_arr.join("&");
    }
    return rtn;
}

var checkAnotherItems = function(object, endereco, erro) {    
    try {

        var titles = $(object).filter('div.main').find('[title]');
        titles.each(function (k) {
            var title = titles[k].title;

            if (title.startsWith('@')) {
                var mensagem = 'Arroba detectada no tooltip: ' + title;
                erro(object, endereco, mensagem);
            }
        });

        var alts = $(object).filter('div.main').find('[alt]');
        alts.each(function (k) {
            var alt = alts[k].alt;

            if (alt.startsWith('@') > 0) {
                var mensagem = 'Arroba detectada no tootip: ' + alt;
                erro(object, endereco, mensagem);
            }
        });
        var findpattern = /([\s]*?)╠╠(●|○)╣(\s|)(.*?)(\s|)╠((?:.|\s)*?)╣╠((?:.|\s)*?)╣╠((?:.|\n)*?)╣╣([\s]*?)/;
        var trads = $(object).find(":contains('○')")
            .filter(function () {
                return (findpattern.test($(this).text()) && $(this).children().filter(function () {
                    return findpattern.test($(this).text());
                }).length === 0);
            })
            .each(function (k) {
            var res = StringToTranslationObject($(this).html());
            $(res).each(function (i) {
                if ($.inArray(this.translationKey, FAULTRANSLATIONS) == -1) {
                    FAULTRANSLATIONS.push(this.translationKey);
                    var mensagem = 'Falta tradução em: ' + this.translationKey;
                    erro(object, endereco, mensagem);                    
                }
            });            
        });
    } catch (e) {
        console.log(e);
    }    
};

var Carrega = function (href, __callback, __addToLineCb, __completeErroInfo, breadcrum, _cbUpdSt) {
    var ajaxTime = new Date().getTime();

    if (typeof(href) === 'undefined')
        return;

    $.ajax({
        url: href,
        beforeSend: function (xhr) {
            xhr.setRequestHeader(
				'X-Requested-With',
				{
				    toString: function () { return ''; }
				}
			);
            ajaxTime = new Date().getTime();
            //console.log("Abrindo " + breadcrum);
            PesquisandoAgora = { 'endereco': href, 'breadcrum': breadcrum }
        },
        success: function (o) {
            $(o).find('script').remove();
            var responseTime = new Date().getTime() - ajaxTime;           

            checkAnotherItems(o, href, __completeErroInfo);

            if (IsThisJson(o)) {
                o.status = 'Resposta em formato não permitido: JSON.';
                __completeErroInfo(o, href);
                __callback();
                return;
            }

            if (href.indexOf('Sort') !== -1)
                return;            

            try {
                var links = $(o).filter('div.main').find('a');
                links = $.merge(links, $(o).filter('div.app-menu').find('a'))
            }
            catch (err) {
                var parametros = { 'erro': err, 'locais': [href] };
                Erros.push(parametros);
                return;
            }

            if (typeof (links) === 'undefined')
                return;

            if (typeof(breadcrum) === 'undefined')
                breadcrum = $(o).filter('title').text().trim();

            if (typeof (_cbUpdSt) !== 'undefined')
                _cbUpdSt(responseTime, href, breadcrum, $(o).closest('#memusage').attr('value') / 1048576, o.length);

            links.each(function (k) {                
                if (DeveSerEnfileradoPraTeste(this)) {
                    var stringId = ($(this).text().trim() === '') ? (typeof($(this).attr('title'))==='undefined')? LoadInfo(this):$(this).attr('title').trim():$(this).text().trim();
                    var visita = { 'endereco': LoadInfo(this), 'origem': href, 'tempo': responseTime, 'size': o.length, 'breadcrum': breadcrum + ' > ' + stringId };
                    __addToLineCb(visita);
                }
            });
        },
        error: function (o) {
            try {
                if ($(o.responseText).find('div#detail').text().trim().indexOf('Id_GEN_TabelaCampo') > 0 ||
                    $(o.responseText).find('div#detail').text().trim().indexOf('Id_ATM_GrupoAtualizacao') > 0) {
                    __callback();
                    return;
                }
            } catch (e) {
                
            }            
            __completeErroInfo(o, href);             
            __callback();
        }
    }).done(function (o) { __callback(); });
}