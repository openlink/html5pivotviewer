//Collection loader interface - used so that different types of data sources can be used
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
    init: function (CXMLUri) {
        this.CXMLUri = CXMLUri;
    },
    LoadCollection: function (collection) {
        var collection = collection;
        this._super(collection);

        collection.CXMLBase = this.CXMLUri;

        $.ajax({
            type: "GET",
            url: this.CXMLUri,
            dataType: "xml",
            success: function (xml) {
                Debug.Log('CXML loaded');
                var collectionRoot = $(xml).find("Collection")[0];
                //get namespace local name
                var namespacePrefix = "P";
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
                for (var i = 0; i < facetCategories.length; i++) {
                    var facetElement = $(facetCategories[i]);

                    var facetCategory = new PivotViewer.Models.FacetCategory(
                    facetElement.attr("Name"),
                        facetElement.attr("Format"),
                        facetElement.attr("Type"),
                        facetElement.attr(namespacePrefix + ":IsFilterVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsFilterVisible").toLowerCase() == "true" ? true : false) : true,
                        facetElement.attr(namespacePrefix + ":IsMetaDataVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsMetaDataVisible").toLowerCase() == "true" ? true : false) : true,
                        facetElement.attr(namespacePrefix + ":IsWordWheelVisible") != undefined ? (facetElement.attr(namespacePrefix + ":IsWordWheelVisible").toLowerCase() == "true" ? true : false) : false
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
                }
                //Items
                var facetItems = $(xml).find("Items");
                if (facetItems.length == 1) {
                    collection.ImageBase = $(facetItems[0]).attr("ImgBase");
                    var facetItem = $(facetItems[0]).find("Item");
                    for (var i = 0; i < facetItem.length; i++) {
                        var item = new PivotViewer.Models.Item(
                            $(facetItem[i]).attr("Img").replace("#", ""),
                            $(facetItem[i]).attr("Id"),
                            $(facetItem[i]).attr("Href"),
                            $(facetItem[i]).attr("Name")
                        );
                        var description = $(facetItem[i]).find("Description");
                        if (description.length == 1 && description[0].childNodes.length)
                            item.Description = description[0].childNodes[0].nodeValue;
                        var facets = $(facetItem[i]).find("Facet");
                        for (var j = 0; j < facets.length; j++) {
                            var f = new PivotViewer.Models.Facet(
                                $(facets[j]).attr("Name")
                            );

                            var facetChildren = $(facets[j]).children();
                            for (var k = 0; k < facetChildren.length; k++) {
                                if (facetChildren[k].nodeType == 1) {
                                    var v = $.trim($(facetChildren[k]).attr("Value"));
                                    if (v == null) {
                                        var fValue = new PivotViewer.Models.FacetValue($(facetChildren[k]).attr("Name"));
                                        fValue.Href = $(facetChildren[k]).attr("Href");
                                        f.AddFacetValue(fValue);
                                    } else {
                                        //convert strings to numbers so histogram can work
                                        if (facetChildren[k].nodeName == "Number") {
                                            var fValue = new PivotViewer.Models.FacetValue(parseFloat(v));
                                            f.AddFacetValue(fValue);
                                        } else {
                                            var fValue = new PivotViewer.Models.FacetValue(v);
                                            f.AddFacetValue(fValue);
                                        }
                                    }
                                }
                            }
                            item.Facets.push(f);
                        }
                        collection.Items.push(item);
                    }
                }
                $.publish("/PivotViewer/Models/Collection/Loaded", null);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //Make sure throbber is removed else everyone thinks the app is still running
                $('.pv-loading').remove();

                //Throw an alert so the user knows something is wrong
                var msg = '';
                msg = msg + 'Error loading CXML Collection\r\n\r\n';
                msg = msg + 'URL        : ' + this.url + '\r\n';
                msg = msg + 'Statuscode : ' + jqXHR.status + '\r\n';
                msg = msg + 'Details    : ' + errorThrown + '\r\n';
                msg = msg + '\r\nPivot Viewer cannot continue until this problem is resolved\r\r';
                window.alert(msg);
            }
        });
    }
});