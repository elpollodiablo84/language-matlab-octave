test2()

%% Transpose
A1 = B';
A2 = {B, (C + D)'}';
A3 = [B, C']';

%% Strings
fprintf(fid, "test1 + ""%s + ''test%.5f", "test2", 3e-2);  % Escaping "" in string
cmd = sprintf('test1 + ""%s + ''test%.5f', 'test2', 3e-2); % Escaping '' in char array
!shutdown

%%
C = 1; % <-- This line shouldn't be a comment if you put a space after %%
% Litle comment
A = 3*C;
%{
Comment block
%} % Comment of a comment

%% if/elseif/else
if (condition == 1)
    body = 1;
elseif (condition == 2)
    body = 2;

    if (body == 2), do_that(); end

else
    body = 3;
end

%% while
while condition
    body
end

%% switch/case/otherwise
switch var
    case 'string'
        body2 = 1;
    otherwise
        body2 = 0;
end

%% try/catch
try
    this();
catch exception
    that();
end

%% for
for j = 1:M, do_this(); end

for i = 1:n
    body = body + 1;
    for k = 1:2:N
        body = body - 1;
    end
end
