//
//  HTML5 PivotViewer
//
//  Original Code:
//    Copyright (C) 2011 LobsterPot Solutions - http://www.lobsterpot.com.au/
//    enquiries@lobsterpot.com.au
//
//  Enhancements:
//    Copyright (C) 2012-2019 OpenLink Software - http://www.openlinksw.com/
//
//  This software is licensed under the terms of the
//  GNU General Public License v2 (see COPYING)
//

///  Collection loader interface - used so that different types of data sources can be used
PivotViewer.Models.Loaders.ICollectionLoader = Object.subClass({
    init: function () { },
    LoadCollection: function (collection) {
        if (!collection instanceof PivotViewer.Models.Collection) {
            throw "collection not an instance of PivotViewer.Models.Collection.";
        }
    }
});

//CXML loader
PivotViewer.Models.Loaders.CXMLLoader = PivotViewer.Models.Loaders.ICollectionLoader.subClass({
    init: function (CXMLUri, proxy, allowHosts, allowedHostsParam) {
        this.CXMLUriNoProxy = CXMLUri;
        if (proxy)
            this.CXMLUri = proxy + CXMLUri;
        else 
            this.CXMLUri = CXMLUri;
        if (allowHosts)
          this.allowHosts = allowHosts;
        else 
          this.allowHosts = false;
        this.allowedHosts = [];
        if (allowedHostsParam)
          this.allowedHosts = allowedHostsParam.split(',');
    },
    CheckAllowedServer: function () {
     var host;
     if (this.CXMLUri.startsWith ('http://')) {
       host = this.CXMLUri.substring(7, this.CXMLUri.indexOf('/' , 7));
     } else if (this.CXMLUri.startsWith ('https://')) {
       host = this.CXMLUri.substring(8, this.CXMLUri.indexOf('/' , 8));
     } else
       return true;

     // Do we have an allowed list?
     if (this.allowHosts) {
       for (var i = 0; i < this.allowedHosts.length; i++) {
         if (host == this.allowedHosts[i] || this.allowedHosts[i] == '*')
           return true;
       }
     }

     if (host == 'localhost' || (host.includes(':') && host.startsWith('localhost:')) ||
           host == '127.0.0.1' || (host.includes(':') && host.startsWith('127.0.0.1:')) ||
           host == location.host) {
           return true;
     } else {
         return false;
     }
    },
    LoadCollection: function (collection) {
        var collection = collection;
        this._super(collection);

        collection.CollectionBaseNoProxy = this.CXMLUriNoProxy;
        collection.CollectionBase = this.CXMLUri;

        // Before loading check that the server that the collection is loaded from is either 
        // localhost or whitelisted.
        if (this.CheckAllowedServer() == false) {
          throw "Collection is not hosted on an allowed server";
          return;
        }

        $.ajax({
            type: "GET",
            url: this.CXMLUri,
            dataType: "xml",
	    crossDomain : true,
            success: function (xml) {
                PivotViewer.Debug.Log('CXML loaded');
                var collectionRoot = $(xml).find("Collection")[0];
                var maxRelatedLinksLength = 0;
                //get namespace local name
                var namespacePrefix = "P";

                if (collectionRoot == undefined) {
                    //Make sure throbber is removed else everyone thinks the app is still running
                    $('.pv-loading').remove();
 
                    //Display message so the user knows something is wrong
                    var msg = '';
                    msg = msg + 'Error parsing CXML Collection<br>';
                    msg = msg + '<br>Pivot Viewer cannot continue until this problem is resolved<br>';
                    $('.pv-wrapper').append("<div id=\"pv-parse-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
                    var t=setTimeout(function(){window.open("#pv-parse-error","_self")},1000)
                    throw "Error parsing CXML Collection";
                }

                for (var i = 0; i < collectionRoot.attributes.length; i++) {
                    if (collectionRoot.attributes[i].value == "http://schemas.microsoft.com/livelabs/pivot/collection/2009") {
                        namespacePrefix = collectionRoot.attributes[i].localName != undefined ? collectionRoot.attributes[i].localName : collectionRoot.attributes[i].baseName;
                        break;
                    }
                }
                collection.CollectionName = $(collectionRoot).attr("Name");
                collection.BrandImage = $(collectionRoot).attr(namespacePrefix + ":BrandImage") != undefined ? $(collectionRoot).attr(namespacePrefix + ":BrandImage") : "";

                //FacetCategory
                var facetCategories = $(xml).find("FacetCategory");
                savedNamespacePrefix = namespacePrefix;
                for (var i = 0; i < facetCategories.length; i++) {
                    var facetElement = $(facetCategories[i]);

                    // Handle locally defined namespaces
                    for (var j = 0; j < facetElement[0].attributes.length; j++) {
                        if (facetElement[0].attributes[j].value == "http://schemas.microsoft.com/livelabs/pivot/collection/2009") {
                            namespacePrefix = facetElement[0].attributes[j].localName != undefined ? facetElement[0].attributes[j].localName : facetElement[0].attributes[j].baseName;
                            break;
                        }
                    }

                    var facetCategory = new PivotViewer.Models.FacetCategory(
                    facetElement.attr("Name"),
                        facetElement.attr("Format"),
                        facetElement.attr("Type"),
                        facetElement.attr(namespacePrefix + ":IsFilterVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsFilterVisible").toLowerCase() == "true" ? true : false) : true,
                        facetElement.attr(namespacePrefix + ":IsMetaDataVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsMetaDataVisible").toLowerCase() == "true" ? true : false) : true,
                        facetElement.attr(namespacePrefix + ":IsWordWheelVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsWordWheelVisible").toLowerCase() == "true" ? true : false) : true
                        );

                    //Add custom sort order
                    var sortOrder = facetElement.find(namespacePrefix + "\\:SortOrder");
                    var sortValues = sortOrder.find(namespacePrefix + "\\:SortValue");

                    if (sortOrder.length == 0) {
                        //webkit doesn't seem to like the P namespace
                        sortOrder = facetElement.find("SortOrder");
                        sortValues = sortOrder.find("SortValue");
                    }

                    if (sortOrder.length == 1) {
                        var customSort = new PivotViewer.Models.FacetCategorySort(sortOrder.attr("Name"));
                        for (var j = 0; j < sortValues.length; j++) {
                            customSort.SortValues.push($(sortValues[j]).attr("Value"));
                        }
                        facetCategory.CustomSort = customSort;
                    }
                    collection.FacetCategories.push(facetCategory);
                    namespacePrefix = savedNamespacePrefix;
                }
                //Items
                var facetItems = $(xml).find("Items");
                if (facetItems.length == 1) {
                    var facetItem = $(facetItems[0]).find("Item");
                    collection.ImageBase = $(facetItems[0]).attr("ImgBase");
                    if (facetItem.length == 0) {
                        //Make sure throbber is removed else everyone thinks the app is still running
                        $('.pv-loading').remove();
 
                        //Display a message so the user knows something is wrong
                        var msg = '';
                        msg = msg + 'There are no items in the CXML Collection<br><br>';
                        $('.pv-wrapper').append("<div id=\"pv-empty-collection-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
                        var t=setTimeout(function(){window.open("#pv-empty-collection-error","_self")},1000)
                    } else {
                        for (var i = 0; i < facetItem.length; i++) {
                            var item = new PivotViewer.Models.Item(
                                $(facetItem[i]).attr("Img").replace("#", ""),
                                $(facetItem[i]).attr("Id"),
                                $(facetItem[i]).attr("Href"),
                                $(facetItem[i]).attr("Name")
                            );
                            var description = $(facetItem[i]).find("Description");
                            if (description.length == 1 && description[0].childNodes.length)
                                item.Description = PivotViewer.Utils.HtmlSpecialChars(description[0].childNodes[0].nodeValue);
                            var facets = $(facetItem[i]).find("Facet");
                            for (var j = 0; j < facets.length; j++) {
                                var f = new PivotViewer.Models.Facet(
                                    $(facets[j]).attr("Name")
                                );
               
                                var facetChildren = $(facets[j]).children();
                                for (var k = 0; k < facetChildren.length; k++) {
                                    if (facetChildren[k].nodeType == 1) {
                                        var v = $.trim($(facetChildren[k]).attr("Value"));
                                        if (v == null || v == "") {
                                            if (facetChildren[k].nodeName == "Link") {
                                                if ($(facetChildren[k]).attr("Href") == "" || $(facetChildren[k]).attr("Href") == null) {
                                                   var fValue = new PivotViewer.Models.FacetValue(PivotViewer.Utils.HtmlSpecialChars("(empty Link)"));
                                                   f.AddFacetValue(fValue);
                                              
                                                } else if ($(facetChildren[k]).attr("Name") == "" || $(facetChildren[k]).attr("Name") == null) {
                                                    var fValue = new PivotViewer.Models.FacetValue("(unnamed Link)");
                                                    fValue.Href = $(facetChildren[k]).attr("Href");
                                                    f.AddFacetValue(fValue);
                                                } else { 
                                                    var fValue = new PivotViewer.Models.FacetValue($(facetChildren[k]).attr("Name"));
                                                    fValue.Href = $(facetChildren[k]).attr("Href");
                                                    f.AddFacetValue(fValue);
                                                } 
                                            } else { 
                                                var fValue = new PivotViewer.Models.FacetValue(PivotViewer.Utils.HtmlSpecialChars("(empty " + facetChildren[k].nodeName + ")"));
                                                f.AddFacetValue(fValue);
                                            }
                                        } else {
                                            //convert strings to numbers so histogram can work
                                            if (facetChildren[k].nodeName == "Number") {
                                                var fValue = new PivotViewer.Models.FacetValue(parseFloat(v));
                                                f.AddFacetValue(fValue);
                                            } else {
                                                var fValue = new PivotViewer.Models.FacetValue(PivotViewer.Utils.HtmlSpecialChars(v));
                                                f.AddFacetValue(fValue);
                                            }
                                        }
                                    }
                                }
                                item.Facets.push(f);
                            }
                            var itemExtension = $(facetItem[i]).find("Extension");
                            if (itemExtension.length == 1) {
                                var savedNamespacePrefix = namespacePrefix;
                    
                                // Handle locally defined namespaces
                                for (var j = 0; j < itemExtension[0].childNodes.length; j++) {
                                    namespacePrefix = itemExtension[0].childNodes[j].lookupPrefix("http://schemas.microsoft.com/livelabs/pivot/collection/2009");
                                    if (namespacePrefix)
                                        break;
                                }

                                //var itemRelated = $(itemExtension[0]).find('d1p1\\:Related, Related');
                                var itemRelated = $(itemExtension[0]).find(namespacePrefix + '\\:Related, Related');
                                if (itemRelated.length == 1) {
                                    var links = $(itemRelated[0]).find(namespacePrefix + '\\:Link, Link');
                                    for (var l = 0; l < links.length; l++) {
                                        var linkName = $(links[l]).attr("Name"); 
                                        var linkHref = $(links[l]).attr("Href"); 
                                        if (linkHref.indexOf(".cxml") == -1 && 
                                            linkHref.indexOf("pivot.vsp") >= 0) {
                                                var url = $.url(this.url);
                                                linkHref = url.attr('protocol') + "://" + url.attr('authority') + url.attr('directory') + linkHref;
                                        }
                                        else if (linkHref.indexOf(".cxml") == -1 && 
                                            linkHref.indexOf("sparql") >= 0) {
                                                var url = $.url(this.url);
                                                linkHref = location.origin + location.pathname  +"?url=" + linkHref;
                                        }
                                        var link = new PivotViewer.Models.ItemLink(linkName, linkHref);
                                        item.Links.push(link);
                                    }
                                    if (links.length > maxRelatedLinksLength)
                                       maxRelatedLinksLength = links.length;
                                }
                                namespacePrefix = savedNamespacePrefix;
                            }
                            collection.Items.push(item);
                        }
                    }
                }
                collection.MaxRelatedLinks = maxRelatedLinksLength;
                //Extensions
                var extension = $(xml).find("Extension");
                if (extension.length > 1) {
                    for (x = 0; x < extension.length; x++) {
                        var savedNamespacePrefix = namespacePrefix;
                    
                        // Handle locally defined namespaces
                        for (var j = 0; j < extension[x].childNodes.length; j++) {
                            namespacePrefix = extension[0].childNodes[j].lookupPrefix("http://schemas.microsoft.com/livelabs/pivot/collection/2009");
                            if (namespacePrefix)
                                break;
                        }

                        //var collectionCopyright = $(extension[x]).find('d1p1\\:Copyright, Copyright');
                        var collectionCopyright = $(extension[x]).find(namespacePrefix + '\\:Copyright, Copyright');
                        if (collectionCopyright.length > 0) { 
                            collection.CopyrightName = $(collectionCopyright[0]).attr("Name");
                            collection.CopyrightHref = $(collectionCopyright[0]).attr("Href");
                            break;
                        }
                        namespacePrefix = savedNamespacePrefix;
                    }
                }

                if (facetItem.length > 0) 
                  $.publish("/PivotViewer/Models/Collection/Loaded", null);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //Make sure throbber is removed else everyone thinks the app is still running
                $('.pv-loading').remove();

		var state = {
			endpoint:	this.url,
			httpCode:	jqXHR.status,
			status:		jqXHR.statusText,
			message:	errorThrown,
			response:	jqXHR.responseText,
		}

		var p = document.createElement('a');
		p.href = this.url;

		state.endpoint = p.protocol + '//' + p.host + p.pathname;

		if (state.status === 'timeout') {
		  state.message = "Timeout loading collection document";
		} else if (state.status === 'error') {
		  if (this.crossDomain && (p.hostname !== window.location.hostname)) {
		    state.message = "Possible issue with CORS settings on the endpoint"
		  }
		} 

                //Display a message so the user knows something is wrong
                var msg = '';
                msg = msg + 'Error loading CXML Collection:<br><br><table>';
		msg = msg + '<colgroup><col style="white-space:nowrap;"><col></colgroup>';
                msg = msg + '<tr><td>Endpoint</td><td>' + state.endpoint + '</td></tr>';
                msg = msg + '<tr><td>Status</td><td>' + state.httpCode + '</td></tr>';
                msg = msg + '<tr><td>Error</td><td> ' + state.message  + '</td></tr>';
                msg = msg + '<tr><td style="vertical-align:top">Details</td><td>' + state.response + '</td></tr>';
                msg = msg + '</table><br>Pivot Viewer cannot continue until this problem is resolved<br>';
                $('.pv-wrapper').append("<div id=\"pv-loading-error\" class=\"pv-modal-dialog\"><div><a href=\"#pv-modal-dialog-close\" title=\"Close\" class=\"pv-modal-dialog-close\">X</a><h2>HTML5 PivotViewer</h2><p>" + msg + "</p></div></div>");
                var t=setTimeout(function(){window.open("#pv-loading-error","_self")},1000)
            }
        });
    }
});
