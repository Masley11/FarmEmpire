
{ pkgs }: {
  deps = [
    pkgs.openssh_gssapi
    pkgs.pkg
    pkgs.python3
    pkgs.python3Packages.pip
  ];
}
