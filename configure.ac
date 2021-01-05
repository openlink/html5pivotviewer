#
#  This file is part of the html5 pivotviewer project
#
#  Copyright (C) 2012-2021 OpenLink Software
#
#  This project is free software; you can redistribute it and/or modify it
#  under the terms of the GNU General Public License as published by the
#  Free Software Foundation; only version 2 of the License, dated June 1991.
#
#  This program is distributed in the hope that it will be useful, but
#  WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
#  General Public License for more details.
#
#  You should have received a copy of the GNU General Public License along
#  with this program; if not, write to the Free Software Foundation, Inc.,
#  51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
#
#

#AC_PREREQ(2.60)
AC_INIT(
	[HTML5 PivotViewer], 
	[1.1],
	[opensource@openlinksw.com],
	[html5pivotviewer]
)
AC_CONFIG_MACRO_DIR([admin])
AC_CONFIG_AUX_DIR([admin])
AM_INIT_AUTOMAKE([foreign])

# --------------------------------------------------------------
# Check for python (vadpacker)
# --------------------------------------------------------------
AM_PATH_PYTHON([2.7])


# --------------------------------------------------------------
# Check for vadpacker as distributed with Virtuoso
# Allow a manual override
# --------------------------------------------------------------
AC_ARG_WITH(
  [vadpacker],
  [AS_HELP_STRING(
    [--with-vadpacker=DIR],
    [Specify the full path to the vadpacker script to use. If not provided configure will search the PATH.])],
    [
	case "$withval" in
	yes|no)
		vadpacker_dir=$srcdir/vadpacker
		;;
	*)
		vadpacker_dir="$withval"
		;;
	esac
    ],[vadpacker_dir=$srcdir/vadpacker])

abs_vadpacker_dir=`cd "$vadpacker_dir" && pwd`
AC_PATH_PROG([VADPACKER], [vadpacker.py], notfound, ["$abs_vadpacker_dir:$PATH"])
if test "x$VADPACKER" = "xnotfound"; then
  AC_MSG_ERROR([cannot find vadpacker.py. Consider using --with-vadpacker=DIR])
fi


# --------------------------------------------------------------
# Allow to specify the installation vad dir
# --------------------------------------------------------------
AC_ARG_WITH(
  [vaddir],
  [AS_HELP_STRING(
    [--with-vaddir=PATH],
    [Specify the full path to where the vad packages should be installed. Defaults to DATADIR/virtuoso/vad.])],
  [vaddir=${withval}],
  [vaddir=$datadir/virtuoso/vad])


# Make all required variables available
AC_SUBST([vaddir])


AC_CONFIG_FILES([
  Makefile
])


AC_OUTPUT

# --------------------------------------------------------------
# Show a summary to the user
# --------------------------------------------------------------
B=`tput bold 2>/dev/null`
N=`tput sgr0 2>/dev/null`

echo ""
echo ""
echo "${B}${PACKAGE_STRING} configuration summary${N}"
echo "${PACKAGE_STRING} configuration summary" | sed 's/./=/g'
echo ""
echo "VAD version:           `./gen_version.sh`"
echo "VAD install directory: $vaddir"
echo ""
echo "Python:                $PYTHON ($PYTHON_VERSION)"
echo "Vadpacker:             $VADPACKER"
echo ""
echo "${B}Next Steps:${N}"
echo "Build the PivotViewer vad package via:"
echo "  # make"
echo "Install the PivotViewer vad package via:"
echo "  # make install"
echo ""
