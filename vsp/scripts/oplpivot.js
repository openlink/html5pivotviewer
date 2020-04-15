/*
 *   This file is part of the html5 pivotviewer project
 *
 *   Copyright (C) 2012-2020 OpenLink Software
 *
 *   This project is free software; you can redistribute it and/or modify it
 *   under the terms of the GNU General Public License as published by the
 *   Free Software Foundation; only version 2 of the License, dated June 1991.
 *
 *   This program is distributed in the hope that it will be useful, but
 *   WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 *   General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

function SetBookmark(collectionBaseUri, bookmark, title)
{
        if (!collectionBaseUri) {
	    var query = location.search;
            if (!query)
              query = "?url=" + encodeURIComponent(collectionUri.defaultValue);
	    // Remove fragment (uri encoded hash)
	    var hashIndex;
	    hashIndex = location.search.indexOf("%23%");
	    if ( hashIndex > 0 )
		    query = location.search.substring( 0, hashIndex );
	    // Remove fragment (non uri encoded hash)
	    if (!query) {
                hashIndex = location.search.indexOf("#");
                if ( hashIndex > 0 )
                    query = location.search.substring( 0, hashIndex );
	    }
        }
        else
            query = "?url=" + encodeURIComponent(collectionBaseUri);

	var new_bookmark = location.protocol + '//' + location.host + '/HtmlPivotViewer/' + query + encodeURIComponent( bookmark );
	var edit_bookmark = location.protocol + '//' + location.host + '/HtmlPivotViewer/edit.vsp' + query + encodeURIComponent( bookmark );
	var el;

	//
	//  Update AddThis links
	//
	el = document.getElementById ("sharelink");
	if (el) {
		try {
			el.setAttribute ('addthis:url', new_bookmark);
			el.setAttribute ('addthis:title', title);

			addthis.update('share', 'url', new_bookmark);
			addthis.update('share', 'title', title);
			addthis.update('config', 'ui_cobrand', 'PivotViewer');

			addthis.toolbox ('#sharelink');		// redraw
			addthis.init();
		} catch (e) {}
	}

	//
	//  Updated permalink
	//
	el = document.getElementById ("permalink");
	if (el) {
		el.href = new_bookmark;
	}

	//
	//  Updated edit link
	//
	el = document.getElementById ("editlink");
	if (el) {
		el.href = edit_bookmark;
	}

	//
	//  Update QR Code
	//
//	el = document.getElementById ("qrcode_img");
//	if (el) {
//		el.src = new_qrcode;
//	}
}

function pivotviewer_post ()
{
	var url= "";

	//  Create new form to post to PivotViewer
	var form = document.createElement("form");
	form.setAttribute("method", "post");
	form.setAttribute("action", "/PivotViewer/");

	//  Add URL as hidden field
	var field = document.createElement("input");
	field.setAttribute("type", "hidden");
	field.setAttribute("name", "url");
	field.setAttribute("value", url);
	form.appendChild(field);

	// Add form to document
	document.body.appendChild(form);

	// Submit it
	form.submit();
}

function pivotviewer_resize()
{
	var myWidth = 620, myHeight = 460;

	if( typeof( window.innerWidth ) == 'number' ) {
		//Non-IE
		myWidth = window.innerWidth;
		myHeight = window.innerHeight;
	} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
		//IE 6+ in 'standards compliant mode'
		myWidth = document.documentElement.clientWidth;
		myHeight = document.documentElement.clientHeight;
	} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
		//IE 4 compatible
		myWidth = document.body.clientWidth;
		myHeight = document.body.clientHeight;
	}

	//  Now resize the pivotviewer control
	myElement = document.getElementById ("MD");
	if (myElement) { myElement.style.height = (myHeight - 120) + "px"; }
}
