//
//  HTML5 PivotViewer
//
//  Original Code:
//    Copyright (C) 2011 LobsterPot Solutions - http://www.lobsterpot.com.au/
//    enquiries@lobsterpot.com.au
//
//  Enhancements:
//    Copyright (C) 2012-2021 OpenLink Software - http://www.openlinksw.com/
//
//  This software is licensed under the terms of the
//  GNU General Public License v2 (see COPYING)
//

PivotViewer.Models.Collection = Object.subClass({
	init: function () {
		var xmlns = "http://schemas.microsoft.com/collection/metadata/2009",
		xmlnsp = "http://schemas.microsoft.com/livelabs/pivot/collection/2009";
		this.CollectionName = "";
		this.BrandImage = "";
		this.FacetCategories = [];
		this.Items = [];
		this.CollectionBase = "";
		this.CollectionBaseNoProxy = "";
		this.ImageBase = "";
                this.CopyrightName = "";
                this.CopyrightHref = "";
                this.MaxRelatedLinks = 0;
	},
	GetItemById: function (Id) {
		for (var i = 0; i < this.Items.length; i++) {
			if (this.Items[i].Id == Id)
				return this.Items[i];
		}
		return null;
	},

	GetFacetCategoryByName: function (categoryName) {
		for (var i = 0; i < this.FacetCategories.length; i++) {
			if (this.FacetCategories[i].Name == categoryName)
				return this.FacetCategories[i];
		}
		return null;
	}
});

//PivotViewer.Models
PivotViewer.Models.FacetCategory = Object.subClass({
	init: function (Name, Format, Type, IsFilterVisible, IsMetaDataVisible, IsWordWheelVisible, CustomSort) {
                this.Name = Name;
		this.Format = Format;
		this.Type = Type != null && Type != undefined ? Type : PivotViewer.Models.FacetType.String;
		this.IsFilterVisible = IsFilterVisible != null && IsFilterVisible != undefined ? IsFilterVisible : true;
		this.IsMetaDataVisible = IsMetaDataVisible != null && IsMetaDataVisible != undefined ? IsMetaDataVisible : true;
		this.IsWordWheelVisible = IsWordWheelVisible != null && IsWordWheelVisible != undefined ? IsWordWheelVisible : true;
		this.CustomSort;
                this.decadeBuckets = [];
                this.yearBuckets = [];
                this.monthBuckets = [];
                this.dayBuckets = [];
                this.hourBuckets = [];
                this.minuteBuckets = [];
                this.secondBuckets = [];
	}
});

PivotViewer.Models.FacetCategorySort = Object.subClass({
	init: function (Name) {
		this.Name = Name;
		this.SortValues = [];
	}
});

PivotViewer.Models.Item = Object.subClass({
	init: function (Img, Id, Href, Name) {
		this.Img = Img,
		this.Id = Id,
		this.Href = Href,
		this.Name = Name,
		this.Description,
		this.Facets = [];
                this.Links = [];
	}
});

PivotViewer.Models.ItemLink = Object.subClass({
	init: function (Name, Href) {
                 this.Name = Name;
                 this.Href = Href;
	}
});

PivotViewer.Models.Facet = Object.subClass({
	init: function (Name, Values) {
		this.Name = Name;
                if (Values === undefined)
		  this.FacetValues = [];
                else
		  this.FacetValues = Values;
	},
	AddFacetValue: function (facetValue) {
		this.FacetValues.push(facetValue);
	}
});

PivotViewer.Models.FacetValue = Object.subClass({
	init: function (Value) {
		this.Value = Value;
		this.Href = "";
	}
});

PivotViewer.Models.DateTimeInfo = Object.subClass({
	init: function (Name, StartDate) {
		this.Name = Name;
                this.StartDate = StartDate;
		this.Items = [];
	}
});

PivotViewer.Models.FacetType = {
	String: "String",
	LongString: "LongString",
	Number: "Number",
	DateTime: "DateTime",
	Link: "Link"
};
