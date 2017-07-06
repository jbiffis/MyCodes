
SET src=E:\ForBackup
SET dst=\\fileserver\m

NET USE \\fileserver\m /user:user 1234


robocopy %src% %dst% /s /move   &:: Move files to the server
if not exist %src%\NUL mkdir %src%
robocopy %src% %src% /s /move   &:: Delete empty directories - This should leave us with a blank slate Unless there were errors copying a file
if not exist %src%\NUL mkdir %src%
attrib -s -h -r %src%
robocopy %dst% %src% /e /xf * /xd $RECYCLE.BIN "System Volume Information" OneDriveTemp /R:0 /LEV:3  &:: Replace all directories on local system
attrib -s -h -r %src%


NET USE \\fileserver\m /D