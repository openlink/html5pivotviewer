--
--   This file is part of the html5 pivotviewer project
--
--   Copyright (C) 2012-2014 OpenLink Software
--
--   This project is free software; you can redistribute it and/or modify it
--   under the terms of the GNU General Public License as published by the
--   Free Software Foundation; only version 2 of the License, dated June 1991.
--
--   This program is distributed in the hope that it will be useful, but
--   WITHOUT ANY WARRANTY; without even the implied warranty of
--   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
--   General Public License for more details.
--
--   You should have received a copy of the GNU General Public License along
--   with this program; if not, write to the Free Software Foundation, Inc.,
--   51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
--

create procedure
DB.DBA.PV_GEN_INPUT (in _name varchar, in _type varchar, in _label varchar, in _arr any)
{
	declare _value varchar;
	declare _vec any;
	declare _s varchar;
	declare _c, _i integer;

	if (__tag(_arr) = 193)
		_value := get_keyword (_name, _arr, '');
	else
		_value := _arr || '';

	if (_type <> 'hidden' and _label <> '') {
		http ('<li>\n');
		http (sprintf ('<label for="%s">%s</label><br />\n', _name, _label));
	}

	if (_type = 'hidden') {
		http (sprintf ('<input type="hidden" name="%s" value="%s" />\n', _name, _value));
	} else if (_type = 'url') {
		http (sprintf ('<input type="text" id="%s" name="%s" size="95" value="%s" />\n', _name, _name, _value));
	} else if (_type = 'text') {
		http (sprintf ('<input type="text" id="%s" name="%s" size="95" value="%s" />\n', _name, _name, _value));
	} else if (_type = 'textarea') {
		http (sprintf ('<textarea id="%s" name="%s" rows="10" cols="80">%s</textarea>\n', _name, _name, _value));
	} else if (_type = 'integer') {
		http (sprintf ('<input type="integer" id="%s" name="%s" size="8" value="%s" />\n', _name, _name, _value));
	} else if (_type = 'sponge') {
		_vec := vector (
			'', 'Use only local data (including data retrieved before), but do not retrieve more',
			'soft', 'Retrieve remote RDF data for all missing source graphs',
			'grab-all', 'Retrieve all missing remote RDF data that might be useful',
			'grab-all-seealso', 'Retrieve all missing remote RDF data that might be useful, including seeAlso references',
			'grab-everything', 'Try to download all referenced resources (this may be very slow and inefficient)'
		);
		_c := length(_vec);
		_i := 0;
		http (sprintf ('<select id="%s" name="%s" >\n', _name, _name));
		for (; _i < _c; _i := _i + 2) {
			_s := '';
			if (_value = _vec[_i]) _s := 'selected="selected"';
			http (sprintf ('<option %s value="%s">%s</option>\n', _s, _vec[_i], _vec[_i+1]));
		}
		http ('</select>\n');
	} else if (_type = 'format') {
		_vec := vector (
			'text/cxml', 'CXML',
			'text/cxml+qrcode', 'CXML + QRcode'
		);
		_c := length(_vec);
		_i := 0;
		http (sprintf ('<select id="%s" name="%s" >\n', _name, _name));
		for (; _i < _c; _i := _i + 2) {
			_s := '';
			if (_value = _vec[_i]) _s := 'selected="selected"';
			http (sprintf ('<option %s value="%s">%s</option>\n', _s, _vec[_i], _vec[_i+1]));
		}
		http ('</select>\n');
	} else if (_type = 'cxml_style_subjs') {
		_vec := vector (
			'',                   'No link out',
			'121',                'External resource link',
                        'DESCRIBE',           'External Description Link',
                        'ABOUT_RDF',          'External Sponged Data Link (RDF)',
                        'ABOUT_HTML',         'External Sponged Data Link (HTML)',
                        'LOCAL_TTL',          'External Description Resource (TTL)',
			'LOCAL_NTRIPLES',     'External description resource (NTRIPLES)',
			'LOCAL_JSON',         'External description resource (JSON)',
			'LOCAL_XML',          'External description resource (RDF/XML)'
		);
		_c := length(_vec);
		_i := 0;
		http (sprintf ('<select id="%s" name="%s" >\n', _name, _name));
		for (; _i < _c; _i := _i + 2) {
			_s := '';
			if (_value = _vec[_i]) _s := 'selected="selected"';
			http (sprintf ('<option %s value="%s">%s</option>\n', _s, _vec[_i], _vec[_i+1]));
		}
		http ('</select>\n');
	} else if (_type = 'cxml_style_hrefs') {
		_vec := vector (
			'',                   'Local Faceted Navigation Links',
			'121',                'External Resource Links',
			'LOCAL_PIVOT',        'External Faceted Navigation Links',
                        'DESCRIBE',           'External Description Links',
                        'ABOUT_RDF',          'External Sponged Data Links (RDF)',
                        'ABOUT_HTML',         'External Sponged Data Links (HTML)',
			'LOCAL_TTL',          'External Faceted Description Resource (TTL)',
			'LOCAL_CXML',         'External Faceted Description Resource (CXML)',
			'LOCAL_NTRIPLES',     'External description resource (NTRIPLES)',
			'LOCAL_JSON',         'External description resource (JSON)',
			'LOCAL_XML',          'External description resource (RDFXML)'

		);
		_c := length(_vec);
		_i := 0;
		http (sprintf ('<select id="%s" name="%s" >\n', _name, _name));
		for (; _i < _c; _i := _i + 2) {
			_s := '';
			if (_value = _vec[_i]) _s := 'selected="selected"';
			http (sprintf ('<option %s value="%s">%s</option>\n', _s, _vec[_i], _vec[_i+1]));
		}
		http ('</select>\n');
	} else if (_type = 'reset') {
		http ('<input type="reset" name="reset" value="Reset" />\n');
	} else if (_type = 'submit') {
		http ('<input type="submit" name="submit" value="View" />\n');
	} else if (_type = 'back') {
		http ('<input type="button" name="back" value="Back" onclick="javascript:history.go(-1);" />\n');
	}

	if (_type <> 'hidden' and _label <> '') http ('</li>');
}
;


create function
DB.DBA.PV_DEREF_URI (in _uri any, in base any := '') returns varchar
{
	declare _old_uri varchar;
	declare _new_uri varchar;
	declare _redirects integer;
	declare _hdr any;
	declare _arr any;

	_hdr := null;
	_redirects := 15;
	_new_uri := WS.WS.EXPAND_URL (base, _uri);
again:
	_old_uri := _new_uri;

	--
	--  Too many redirs
	--
	if (_redirects <= 0) return _uri;

	--
	--  Check if we found a known endpoint
	--
	_arr := rfc1808_parse_uri (_new_uri);
	if (_arr[3] like '%.cxml' OR _arr[2] like '/sparql%')
	{
		return _new_uri;
	}

	--
	--  Check HEAD to see if this is a redirect
	--
	http_client_ext (url=>_new_uri, headers=>_hdr, http_method=>'HEAD');
	_redirects := _redirects - 1;

	--
	--  State <> 200 so this this could be a redirect or an invalid uri
	--
	if (_hdr[0] not like 'HTTP/1._ 200 %')
	{
		if (_hdr[0] like 'HTTP/1._ 30_ %')
		{
			--
			--  If we get 30X and valid Location: in header, continue DEREF with this new uri
			--
			_new_uri := http_request_header (_hdr, 'Location');
			if (isstring (_new_uri))
			{
				_new_uri := WS.WS.EXPAND_URL (_old_uri, _new_uri);
			      goto again;
			}
		}

		--
		--  Else return the previous uri
		--
		return _old_uri;
	}

	--
	--  This uri exists (200) so we can return it
	--
	return _new_uri;
}
;


create function
DB.DBA.PV_GEN_LINK (in type integer, in link any, in mimetype varchar, in format varchar) returns varchar
{
    declare _link any;


    --
    --  Guard against using non CXML format on static collections
    --
    if (link like '%.cxml' and format <> 'CXML')
	return '';

    --
    --  Overrule format for non CXML links
    --
    _link := link;
    if (format <> 'CXML')
            _link := sprintf ('%s&output=%U', link, mimetype);

    if (type = 1)
        return sprintf ('<%V>; rel="alternate"; type="%s"; title="Structured Descriptor Document (%s format)" ',
		_link, mimetype, format);
    else if (type = 2)
        return sprintf ('<link rel="alternate" href="%V" type="%s" title="Structured Descriptor Document (%s format)" />\r\n',
		_link, mimetype, format);
    else if (type = 3)
        return sprintf ('<a href="%V" title="Structured Descriptor Document (%s format)" alt="Structured Descriptor Document (%s format)">%s</a>\r\n', _link, mimetype, mimetype, format);
    else if (type = 4)
        return sprintf ('<link rel="edit" href="%V" type="%s" title="Edit %s" />\r\n', link, mimetype, format);
}
;


create function
DB.DBA.PV_URL_REW (in par varchar, in fmt varchar, in val varchar) returns varchar
{
        return sprintf (fmt, split_and_decode (val)[0]) ;
};


create procedure
DB.DBA.PV_make_qr_code (in data_to_qrcode any, in src_width int := 120, in src_height int := 120, in qr_scale int := 4) __SOAP_HTTP 'text/plain'
{
  declare qrcode_bytes, mixed_content, content varchar;
  declare qrcode any;

  if (__proc_exists ('QRcode encodeString8bit', 2) is null)
    return null;

  declare exit handler for sqlstate '*' { return null; };

  content := "IM CreateImageBlob" (src_width, src_height, 'white', 'jpg');
  qrcode := "QRcode encodeString8bit" (data_to_qrcode);
  qrcode_bytes := aref_set_0 (qrcode, 0);
  mixed_content := "IM PasteQRcode" (qrcode_bytes, qrcode[1], qrcode[2], qr_scale, qr_scale, 0, 0, cast (content as varchar), length (content));
  mixed_content := encode_base64 (cast (mixed_content as varchar));
  mixed_content := replace (mixed_content, '\r\n', '');
  return 'data:image/jpg;base64,' || mixed_content;
}
;

DB.DBA.VHOST_REMOVE (
	 lhost=>'*ini*',
	 vhost=>'*ini*',
	 lpath=>'/HtmlPivotViewer'
);


DB.DBA.VHOST_DEFINE (
	 lhost=>'*ini*',
	 vhost=>'*ini*',
	 lpath=>'/HtmlPivotViewer',
	 ppath=>'/DAV/VAD/html5pivotviewer/',
	 is_dav=>1,
	 def_page=>'view.vsp',
	 vsp_user=>'dba',
	 ses_vars=>0,
	 opts=>vector (
	    'executable', 'yes', 
	    'browse_sheet', '', 
	    'url_rewrite', 'http_rule_pv5_list_1',
	    '401_page', '40x.vsp',
	    '403_page', '40x.vsp'),
	 is_default_host=>0
);


DB.DBA.URLREWRITE_CREATE_RULELIST (
	'http_rule_pv5_list_1',
	1,
	vector ('http_rule_pv5_2')
);


DB.DBA.URLREWRITE_CREATE_REGEX_RULE (
	'http_rule_pv5_2',
	1,
	'/HtmlPivotViewer/\\?url=http%3A%2F%2F(.*(?=%23))',
	vector ('par_1'),
	1,
	'http://%s',
	vector ('par_1'),
	'PV_URL_REW',
	'(text/xml)',
	2,
	303,
	''
);

DB.DBA.VHOST_REMOVE (
	 lhost=>'*ini*',
	 vhost=>'*ini*',
	 lpath=>'/HtmlPivotViewer/defaults'
);


DB.DBA.VHOST_DEFINE (
	 lhost=>'*ini*',
	 vhost=>'*ini*',
	 lpath=>'/HtmlPivotViewer/defaults',
	 ppath=>'/DAV/VAD/html5pivotviewer/',
	 is_dav=>1,
	 def_page=>'defaults.vsp',
	 vsp_user=>'dba',
	 ses_vars=>0,
	 is_default_host=>0
);


