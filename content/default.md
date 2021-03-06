# Task 1

[Mininet VM (gzipped)](/mininet-vm-x86_64.vmdk.gz)  
[Cirros VM](/cirros.img)  
[recipe.sh](/recipe.sh)  
[rules.txt](/rules.txt)

If you want to display a LaTeX expression, wrap it with a `Latex&#x200b;Begin->` and `<-Latex&#x200b;End`. This will parse the expression and display it using it HTML. It is rendered with [KaTeX](https://github.com/Khan/KaTeX).

LatexBegin->
Test
<-LatexEnd

LatexBegin->
\\displaystyle\\sum_{i=1}^{k+1}i
<-LatexEnd

    \\displaystyle\\sum_{i=1}^{k+1}i




# Instructions

LOGIN  
mininet: mininet  
cirros:  cubswin:)  

`wget http://lks.noip.me/recipe.sh`  
`wget http://lks.noip.me/rules.txt`  

`chmod u+x recipe.sh`  
`sudo ./recipe.sh`  


# CHECK CONNECTIVITY / LAYOUT, WAIT FOR VIRTUAL MACHINES

(`ssh cirros@10.0.2.16-18`) / (`nmap -sn 10.0.2.0/24`)


`sudo ovs-ofctl drop-flows br0`  
`sudo ovs-ofctl add-flows br0 rules.txt`


# CHECK NEW LAYOUT


`nmap -sn 10.0.2.0/24`


# CHECK CONNECTIVITY


`ssh cirros@10.0.2.16` / `ssh -l cirros 10.0.2.16`  
-> cubswin:)  
-: `ping 10.0.2.17` - SUCCESS  
-: `ping 10.0.2.18` - FAIL  
-: `ssh 10.0.2.17`  
--> cubswin:)  
--: `ping 10.0.2.16` - SUCCESS  
--: `ping 10.0.2.18` - SUCCESS  
--: `ssh 10.0.2.18`  
---> cubswin:)  
---: `ping 10.0.2.17` - SUCCESS  
---: `ping 10.0.2.16` - FAIL  
