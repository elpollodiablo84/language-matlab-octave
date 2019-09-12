test2()

%% Transpose
A1 = B';
A2 = {B, (C + D)'}';
A3 = [B, C']';

%% Strings
fprintf(fid, "test1 + ""%s + ''test%.5f", "test2", 3e-2);  % Escaping "" in string
cmd = sprintf('test1 + ""%s + ''test%.5f', 'test2', 3e-2); % Escaping '' in char array
!shutdown

clear something you want to clear; hold on, grid off % Comment
print ./this_is a_string & also->this; clearvars -except A1;
command > not_a_input

A4 = {B C; not_a_command not_a_input};

%%
C = 1; % <-- This line shouldn't be a comment if you put a space after %%
% Little comment
A = 3*C;
%{
Comment block
%}

%% if/elseif/else
if (condition == 1) % Comment
    body = 1;
elseif (condition == 2) % Comment
    body = 2;

    if (body == 2), false_end(); end

else % Comment
    body = 3;
end

if(test == 'te,st'), body = 4; end % Weird but legit
if[c, d] == [a, b], body = 5; end  % Weird but legit

%% while
while cell2mat(condition)
    body = 1;
end

%% switch/case/otherwise
switch variable
    case 'string' % Comment
        body2 = 1;
    otherwise     % Comment
        body2 = [0; ... This should be a comment also
                 0];
end

%% try/catch
try % Comment
    this();
catch exception %% Comment but not a double percentage comment
    that();
end

%% for
for j = 1:M, do_this(); end % Inline

for i = 1:n % Comment
    body = body + 1;
    for k = 1:2:N
        body = body - 1;
        %% Surprise comment
    end
end
